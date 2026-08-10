export type GameMode = 'warfare' | 'stunt_arena' | 'drift_track';

export type VehicleType = 'cyber_suv' | 'apex_gt' | 'phantom_buggy' | 'combat_truck';

export interface VehicleConfig {
  id: VehicleType;
  name: string;
  tagline: string;
  topSpeed: number; // KM/H
  acceleration: number;
  driftFactor: number;
  armor: number;
  color: string;
  paintHex: number;
  icon: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  kills: number;
  wave: number;
  driftScore: number;
  airTimeScore: number;
  topSpeedReached: number;
}

export interface ControlsState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  fire: boolean;
  drift: boolean;
  nitro: boolean;
  steerAngle: number; // -1 to 1
  gasPedal: number;   // 0 to 1
  brakePedal: number; // 0 to 1
  lookDx: number;
  lookDy: number;
}

export type CameraView = 'tpv' | 'fpv' | 'hood' | 'cinematic';
