import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameMode, VehicleType, CameraView, ControlsState } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { VEHICLES } from './StartMenu';
import { HUD } from './HUD';
import { CarHUD } from './CarHUD';
import { GameOverModal } from './GameOverModal';

interface GameCanvasProps {
  gameMode: GameMode;
  selectedVehicleType: VehicleType;
  paintHex: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  selectedVehicleType,
  paintHex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Game States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [inVehicle, setInVehicle] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>('tpv');

  // Stats
  const [hp, setHp] = useState(100);
  const [wave, setWave] = useState(1);
  const [enemyCount, setEnemyCount] = useState(0);
  const [kills, setKills] = useState(0);
  const [nearVehicle, setNearVehicle] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healProgress, setHealProgress] = useState(0);

  // Car Stats
  const [carSpeed, setCarSpeed] = useState(0);
  const [carRpm, setCarRpm] = useState(1000);
  const [carGear, setCarGear] = useState('1');
  const [nosAmount, setNosAmount] = useState(100);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [driftScore, setDriftScore] = useState(0);
  const [isDrifting, setIsDrifting] = useState(false);
  const [topSpeedReached, setTopSpeedReached] = useState(0);

  // Joystick state
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  // Refs for animation loop & state persistence
  const controlsRef = useRef<ControlsState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    fire: false,
    drift: false,
    nitro: false,
    steerAngle: 0,
    gasPedal: 0,
    brakePedal: 0,
    lookDx: 0,
    lookDy: 0
  });

  const gameStateRef = useRef({
    hp: 100,
    maxHp: 100,
    kills: 0,
    wave: 1,
    driftScore: 0,
    topSpeed: 0,
    inVehicle: false,
    isFiring: false,
    lastFireTime: 0,
    touchJoystickId: null as number | null,
    touchLookId: null as number | null,
    touchFireId: null as number | null,
    joystickStart: { x: 0, y: 0 },
    lookStart: { x: 0, y: 0 },
    fireStart: { x: 0, y: 0 },
    camYaw: 0,
    camPitch: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene, 9:16 Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a5a40);
    scene.fog = new THREE.FogExp2(0x2d4c1e, 0.0035);

    // 9:16 Aspect Ratio Perspective Camera
    const camera = new THREE.PerspectiveCamera(75, 9 / 16, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.3);
    sun.position.set(200, 400, 150);
    sun.castShadow = true;
    sun.shadow.camera.left = -400;
    sun.shadow.camera.right = 400;
    sun.shadow.camera.top = 400;
    sun.shadow.camera.bottom = -400;
    sun.shadow.camera.far = 1200;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    // Player Group (Holds Camera)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 2, 0);
    scene.add(playerGroup);
    playerGroup.add(camera);

    // Weapon Model
    const weaponGroup = new THREE.Group();
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
    );
    gunBody.position.set(0.4, -0.4, -0.9);
    weaponGroup.add(gunBody);
    camera.add(weaponGroup);

    // Procedural Textures
    const createGrassTexture = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 256; cvs.height = 256;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = '#1e3314';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#284719' : '#335b20';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 8);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(150, 150);
      return tex;
    };

    const grassMat = new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.9 });
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Pro Driving Track / Ramps & Obstacles
    const collidables: THREE.Mesh[] = [];
    const bulletTargets: THREE.Mesh[] = [];
    const medkitsList: { mesh: THREE.Mesh; active: boolean }[] = [];

    // Create Ramps & Asphalt Highway for Pro Stunts
    const highway = new THREE.Mesh(new THREE.PlaneGeometry(60, 2000), asphaltMat);
    highway.rotation.x = -Math.PI / 2;
    highway.position.set(0, 0.05, 0);
    highway.receiveShadow = true;
    scene.add(highway);

    // Ramps
    const createRamp = (x: number, z: number, rotationY: number) => {
      const rampGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -10, 0, -15,   10, 0, -15,   10, 8, 15,
        -10, 0, -15,   10, 8, 15,   -10, 8, 15
      ]);
      rampGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      rampGeo.computeVertexNormals();

      const ramp = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ color: 0xffaa00, side: THREE.DoubleSide }));
      ramp.position.set(x, 0, z);
      ramp.rotation.y = rotationY;
      ramp.castShadow = true;
      scene.add(ramp);
      collidables.push(ramp);
    };

    createRamp(0, 200, 0);
    createRamp(0, -300, Math.PI);
    createRamp(150, 100, Math.PI / 4);

    // Medkits
    const mkGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const mkMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x008800 });
    for (let i = 0; i < 25; i++) {
      const mx = (Math.random() - 0.5) * 1200;
      const mz = (Math.random() - 0.5) * 1200;
      const mk = new THREE.Mesh(mkGeo, mkMat);
      mk.position.set(mx, 1.0, mz);
      scene.add(mk);
      medkitsList.push({ mesh: mk, active: true });
    }

    // Vehicle Creation System
    const vehConfig = VEHICLES.find(v => v.id === selectedVehicleType) || VEHICLES[0];

    const buildVehicle = (x: number, z: number, colorHex: number) => {
      const group = new THREE.Group();

      const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.8, roughness: 0.2 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.4, 10), bodyMat);
      body.position.y = 1.2;
      body.castShadow = true;
      group.add(body);

      // Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.5, 5), glassMat);
      cabin.position.set(0, 2.5, -0.5);
      cabin.castShadow = true;
      group.add(cabin);

      // Wheels
      const tGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 24);
      const wheelPositions = [
        [2.4, 0.9, 3.2], [-2.4, 0.9, 3.2],
        [2.4, 0.9, -3.2], [-2.4, 0.9, -3.2]
      ];
      wheelPositions.forEach(p => {
        const w = new THREE.Mesh(tGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(p[0], p[1], p[2]);
        w.castShadow = true;
        group.add(w);
      });

      // Turret if combat truck
      if (selectedVehicleType === 'combat_truck') {
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        turret.position.set(0, 3.4, 0);
        group.add(turret);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 3.4, -1.2);
        group.add(barrel);
      }

      group.position.set(x, 0, z);
      scene.add(group);
      collidables.push(body);
      bulletTargets.push(body);

      return {
        group,
        speed: 0,
        angle: 0,
        nos: 100,
        driftScore: 0,
        armor: vehConfig.armor,
        maxArmor: vehConfig.armor
      };
    };

    const mainCar = buildVehicle(15, 0, paintHex);

    // Dense Jungle Trees
    const trunkGeo = new THREE.CylinderGeometry(1.5, 2.5, 20, 8);
    const leafGeo = new THREE.DodecahedronGeometry(12, 1);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e4620, roughness: 0.9 });

    for (let i = 0; i < 350; i++) {
      const tx = (Math.random() - 0.5) * 1600;
      const tz = (Math.random() - 0.5) * 1600;

      if (Math.abs(tx) > 40 || Math.abs(tz) > 40) {
        const trunk = new THREE.Mesh(trunkGeo, woodMat);
        trunk.position.set(tx, 10, tz);
        trunk.castShadow = true;
        scene.add(trunk);
        collidables.push(trunk);
        bulletTargets.push(trunk);

        const leaves = new THREE.Mesh(leafGeo, leafMat);
        leaves.position.set(tx, 22, tz);
        leaves.castShadow = true;
        scene.add(leaves);
      }
    }

    // AI Enemies System
    interface Enemy {
      mesh: THREE.Group;
      hp: number;
      isDead: boolean;
      hitboxes: THREE.Mesh[];
      lastShot: number;
    }

    let enemies: Enemy[] = [];

    const spawnEnemyWave = (waveNum: number) => {
      enemies.forEach(e => scene.remove(e.mesh));
      enemies = [];

      const enemyCountNum = gameMode === 'warfare' ? Math.min(30, 6 + waveNum * 2) : 0;
      const eArmorMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
      const eSkinMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5 });

      for (let i = 0; i < enemyCountNum; i++) {
        const eGroup = new THREE.Group();

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.8), eArmorMat);
        torso.position.y = 2.0; eGroup.add(torso);

        const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), eSkinMat);
        head.position.y = 3.5; eGroup.add(head);

        // Spawn far away (300m - 500m)
        const angle = Math.random() * Math.PI * 2;
        const radius = 250 + Math.random() * 300;
        eGroup.position.set(
          playerGroup.position.x + Math.cos(angle) * radius,
          0,
          playerGroup.position.z + Math.sin(angle) * radius
        );

        scene.add(eGroup);
        enemies.push({
          mesh: eGroup,
          hp: 80 + waveNum * 10,
          isDead: false,
          hitboxes: [torso, head],
          lastShot: 0
        });
      }

      setEnemyCount(enemies.length);
    };

    spawnEnemyWave(1);

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') { c.moveForward = true; c.gasPedal = 1; }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') { c.moveBackward = true; c.brakePedal = 1; }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { c.moveLeft = true; c.steerAngle = -1; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { c.moveRight = true; c.steerAngle = 1; }
      if (e.code === 'Space') { c.jump = true; c.drift = true; }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { c.nitro = true; }
      if (e.code === 'KeyE') {
        if (gameStateRef.current.inVehicle) {
          exitVehicleAction();
        } else {
          enterVehicleAction();
        }
      }
      if (e.code === 'KeyC') {
        toggleCameraView();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') { c.moveForward = false; c.gasPedal = 0; }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') { c.moveBackward = false; c.brakePedal = 0; }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { c.moveLeft = false; c.steerAngle = 0; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { c.moveRight = false; c.steerAngle = 0; }
      if (e.code === 'Space') { c.jump = false; c.drift = false; }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { c.nitro = false; }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Enter & Exit Vehicle
    const enterVehicleAction = () => {
      const dist = playerGroup.position.distanceTo(mainCar.group.position);
      if (dist < 15) {
        gameStateRef.current.inVehicle = true;
        setInVehicle(true);
        mainCar.group.add(camera);
        camera.position.set(0, 4.5, 6);
        camera.rotation.set(-0.2, 0, 0);
        soundEngine.playUIClick();
      }
    };

    const exitVehicleAction = () => {
      gameStateRef.current.inVehicle = false;
      setInVehicle(false);
      playerGroup.position.copy(mainCar.group.position).add(new THREE.Vector3(5, 2, 0));
      playerGroup.add(camera);
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
      soundEngine.stopEngine();
      soundEngine.playUIClick();
    };

    const toggleCameraView = () => {
      setCameraView(prev => {
        let next: CameraView = 'tpv';
        if (prev === 'tpv') next = 'fpv';
        else if (prev === 'fpv') next = 'hood';
        else next = 'tpv';

        if (next === 'tpv') {
          camera.position.set(0, 4.5, 6);
          camera.rotation.set(-0.2, 0, 0);
        } else if (next === 'fpv') {
          camera.position.set(0, 2.2, 0);
          camera.rotation.set(0, 0, 0);
        } else if (next === 'hood') {
          camera.position.set(0, 1.8, -3.5);
          camera.rotation.set(0, 0, 0);
        }
        return next;
      });
    };

    // Raycast Shooting
    const raycaster = new THREE.Raycaster();

    const fireWeaponAction = () => {
      if (gameStateRef.current.hp <= 0) return;
      soundEngine.playGunshot('player');

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const allTargets: THREE.Mesh[] = [];
      enemies.forEach(e => { if (!e.isDead) allTargets.push(...e.hitboxes); });

      const hits = raycaster.intersectObjects(allTargets);
      if (hits.length > 0) {
        const hitObj = hits[0].object as THREE.Mesh;
        const hitEnemy = enemies.find(e => e.hitboxes.includes(hitObj));

        if (hitEnemy) {
          hitEnemy.hp -= 40;
          if (hitEnemy.hp <= 0) {
            hitEnemy.isDead = true;
            scene.remove(hitEnemy.mesh);
            enemies = enemies.filter(e => e !== hitEnemy);
            setEnemyCount(enemies.length);

            gameStateRef.current.kills += 1;
            setKills(gameStateRef.current.kills);

            if (enemies.length === 0) {
              gameStateRef.current.wave += 1;
              setWave(gameStateRef.current.wave);
              spawnEnemyWave(gameStateRef.current.wave);
            }
          }
        }
      }
    };

    // Main Animation Loop
    let lastTime = performance.now();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (gameStateRef.current.hp <= 0) return;

      const c = controlsRef.current;

      // ----------------------------------------------------------------
      // PRO VEHICLE DRIVING PHYSICS
      // ----------------------------------------------------------------
      if (gameStateRef.current.inVehicle) {
        let maxSpeed = vehConfig.topSpeed;
        if (c.nitro && mainCar.nos > 0) {
          maxSpeed *= 1.35;
          mainCar.nos = Math.max(0, mainCar.nos - delta * 35);
          setIsNitroActive(true);
          soundEngine.playNitroBoost();
        } else {
          setIsNitroActive(false);
          mainCar.nos = Math.min(100, mainCar.nos + delta * 10);
        }
        setNosAmount(mainCar.nos);

        // Acceleration & Braking
        if (c.gasPedal > 0) {
          mainCar.speed += (vehConfig.acceleration * 0.4) * delta;
        } else if (c.brakePedal > 0) {
          mainCar.speed -= 40 * delta;
        } else {
          mainCar.speed *= 0.98; // Friction
        }

        // Cap speed
        mainCar.speed = Math.max(-40, Math.min(maxSpeed, mainCar.speed));
        setCarSpeed(mainCar.speed);

        if (Math.abs(mainCar.speed) > gameStateRef.current.topSpeed) {
          gameStateRef.current.topSpeed = Math.abs(mainCar.speed);
          setTopSpeedReached(gameStateRef.current.topSpeed);
        }

        // Steering & Drifting
        const isTurning = Math.abs(c.steerAngle) > 0.1;
        if (Math.abs(mainCar.speed) > 5) {
          const steerFactor = c.drift ? 2.2 : 1.2;
          const turnDir = mainCar.speed > 0 ? 1 : -1;
          mainCar.angle -= c.steerAngle * steerFactor * delta * turnDir;

          if (c.drift && isTurning && Math.abs(mainCar.speed) > 30) {
            setIsDrifting(true);
            mainCar.driftScore += Math.round(delta * 120);
            gameStateRef.current.driftScore = mainCar.driftScore;
            setDriftScore(mainCar.driftScore);
          } else {
            setIsDrifting(false);
          }
        } else {
          setIsDrifting(false);
        }

        mainCar.group.rotation.y = mainCar.angle;

        // Position movement
        const moveDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mainCar.angle);
        mainCar.group.position.add(moveDir.multiplyScalar(mainCar.speed * delta * 0.5));

        // Engine Sound
        soundEngine.updateEngine(mainCar.speed, vehConfig.topSpeed, c.gasPedal > 0, c.nitro);

        // Telemetry
        const rpm = 1000 + (Math.abs(mainCar.speed) / maxSpeed) * 5500;
        setCarRpm(rpm);
        const gearNum = Math.min(6, Math.max(1, Math.ceil((Math.abs(mainCar.speed) / maxSpeed) * 6)));
        setCarGear(mainCar.speed < -2 ? 'R' : gearNum.toString());

        // Sync player group with car
        playerGroup.position.copy(mainCar.group.position);
      }
      // ----------------------------------------------------------------
      // FPS PLAYER PHYSICS
      // ----------------------------------------------------------------
      else {
        setIsDrifting(false);
        setIsNitroActive(false);

        // FPS Rotation
        playerGroup.rotation.y = gameStateRef.current.camYaw;
        camera.rotation.x = gameStateRef.current.camPitch;

        // Player Walking
        const moveVec = new THREE.Vector3();
        if (c.moveForward) moveVec.z -= 1;
        if (c.moveBackward) moveVec.z += 1;
        if (c.moveLeft) moveVec.x -= 1;
        if (c.moveRight) moveVec.x += 1;

        if (moveVec.lengthSq() > 0) {
          moveVec.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), gameStateRef.current.camYaw);
          playerGroup.position.add(moveVec.multiplyScalar(22 * delta));
        }

        // Proximity to car check
        const distToCar = playerGroup.position.distanceTo(mainCar.group.position);
        setNearVehicle(distToCar < 15);

        // Medkit Healing
        medkitsList.forEach(mk => {
          if (mk.active) {
            mk.mesh.rotation.y += delta * 2;
            if (playerGroup.position.distanceTo(mk.mesh.position) < 4.5 && gameStateRef.current.hp < 100) {
              gameStateRef.current.hp = 100;
              setHp(100);
              soundEngine.playHeal();
              scene.remove(mk.mesh);
              mk.active = false;
            }
          }
        });
      }

      // AI Enemies Update
      enemies.forEach(e => {
        if (e.isDead) return;

        e.mesh.lookAt(playerGroup.position.x, 0, playerGroup.position.z);
        const dist = e.mesh.position.distanceTo(playerGroup.position);

        if (dist > 15) {
          const moveDir = new THREE.Vector3().subVectors(playerGroup.position, e.mesh.position).normalize();
          e.mesh.position.add(moveDir.multiplyScalar(12 * delta));
        }

        // Enemy shooting
        if (dist < 120 && now - e.lastShot > 1800) {
          e.lastShot = now;
          soundEngine.playGunshot('enemy');

          // Damage player (6-hit system)
          gameStateRef.current.hp = Math.max(0, gameStateRef.current.hp - 16.7);
          setHp(gameStateRef.current.hp);

          if (gameStateRef.current.hp <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          }
        }
      });

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      soundEngine.stopEngine();
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameMode, selectedVehicleType, paintHex]);

  // Touch Handlers for HUD Joystick
  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    gameStateRef.current.touchJoystickId = touch.identifier;
    gameStateRef.current.joystickStart = { x: touch.clientX, y: touch.clientY };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === gameStateRef.current.touchJoystickId) {
        const dx = touch.clientX - gameStateRef.current.joystickStart.x;
        const dy = touch.clientY - gameStateRef.current.joystickStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 40;

        const clampX = (dx / (dist || 1)) * Math.min(dist, maxDist);
        const clampY = (dy / (dist || 1)) * Math.min(dist, maxDist);

        setJoystickPos({ x: clampX, y: clampY });

        controlsRef.current.moveLeft = clampX < -10;
        controlsRef.current.moveRight = clampX > 10;
        controlsRef.current.moveForward = clampY < -10;
        controlsRef.current.moveBackward = clampY > 10;
      }
    }
  };

  const handleJoystickEnd = () => {
    gameStateRef.current.touchJoystickId = null;
    setJoystickPos({ x: 0, y: 0 });
    controlsRef.current.moveLeft = false;
    controlsRef.current.moveRight = false;
    controlsRef.current.moveForward = false;
    controlsRef.current.moveBackward = false;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Active Game HUD */}
      {isPlaying && !isGameOver && (
        <>
          {!inVehicle ? (
            <HUD
              hp={hp}
              maxHp={100}
              wave={wave}
              enemyCount={enemyCount}
              kills={kills}
              nearVehicle={nearVehicle}
              isHealing={isHealing}
              healProgress={healProgress}
              onEnterVehicle={() => {
                const c = controlsRef.current;
                c.moveForward = false;
              }}
              onJump={() => {
                controlsRef.current.jump = true;
                setTimeout(() => { controlsRef.current.jump = false; }, 200);
              }}
              onStartFire={() => {
                controlsRef.current.fire = true;
                soundEngine.playGunshot('player');
              }}
              onEndFire={() => {
                controlsRef.current.fire = false;
              }}
              onJoystickStart={handleJoystickStart}
              onJoystickMove={handleJoystickMove}
              onJoystickEnd={handleJoystickEnd}
              joystickPos={joystickPos}
            />
          ) : (
            <CarHUD
              speed={carSpeed}
              rpm={carRpm}
              gear={carGear}
              nosAmount={nosAmount}
              isNitroActive={isNitroActive}
              driftScore={driftScore}
              isDrifting={isDrifting}
              vehicleArmor={100}
              maxVehicleArmor={100}
              cameraView={cameraView}
              onChangeCamera={() => {
                setCameraView(prev => prev === 'tpv' ? 'fpv' : 'tpv');
              }}
              onExitVehicle={() => {
                setInVehicle(false);
                gameStateRef.current.inVehicle = false;
              }}
              onGasStart={() => { controlsRef.current.gasPedal = 1; }}
              onGasEnd={() => { controlsRef.current.gasPedal = 0; }}
              onBrakeStart={() => { controlsRef.current.brakePedal = 1; }}
              onBrakeEnd={() => { controlsRef.current.brakePedal = 0; }}
              onSteerLeftStart={() => { controlsRef.current.steerAngle = -1; }}
              onSteerLeftEnd={() => { controlsRef.current.steerAngle = 0; }}
              onSteerRightStart={() => { controlsRef.current.steerAngle = 1; }}
              onSteerRightEnd={() => { controlsRef.current.steerAngle = 0; }}
              onDriftStart={() => { controlsRef.current.drift = true; }}
              onDriftEnd={() => { controlsRef.current.drift = false; }}
              onNitroStart={() => { controlsRef.current.nitro = true; }}
              onNitroEnd={() => { controlsRef.current.nitro = false; }}
              onHorn={() => { soundEngine.playUIClick(); }}
            />
          )}
        </>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverModal
          wave={wave}
          kills={kills}
          driftScore={driftScore}
          topSpeed={topSpeedReached}
          onRestart={() => window.location.reload()}
        />
      )}
    </div>
  );
};
