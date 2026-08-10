import React from 'react';
import { Shield, Crosshair, Heart, Skull, Zap } from 'lucide-react';

interface HUDProps {
  hp: number;
  maxHp: number;
  wave: number;
  enemyCount: number;
  kills: number;
  nearVehicle: boolean;
  isHealing: boolean;
  healProgress: number;
  onEnterVehicle: () => void;
  onJump: () => void;
  onStartFire: (e: React.TouchEvent | React.MouseEvent) => void;
  onEndFire: () => void;
  onJoystickStart: (e: React.TouchEvent) => void;
  onJoystickMove: (e: React.TouchEvent) => void;
  onJoystickEnd: () => void;
  joystickPos: { x: number; y: number };
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  wave,
  enemyCount,
  kills,
  nearVehicle,
  isHealing,
  healProgress,
  onEnterVehicle,
  onJump,
  onStartFire,
  onEndFire,
  onJoystickStart,
  onJoystickMove,
  onJoystickEnd,
  joystickPos
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none">
      {/* Top Bar Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 bg-black/60 backdrop-blur-md p-2.5 rounded-2xl border border-neutral-800 text-white min-w-[140px]">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide">
            <Shield className="w-3.5 h-3.5" />
            <span>WAVE {wave}</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-neutral-300 font-semibold">
            <div className="flex items-center space-x-1">
              <Crosshair className="w-3 h-3 text-red-400" />
              <span>{enemyCount} LEFT</span>
            </div>
            <div className="flex items-center space-x-1">
              <Skull className="w-3 h-3 text-emerald-400" />
              <span>{kills} KILLS</span>
            </div>
          </div>

          {/* Health Bar (6 Bullets System) */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-0.5">
              <span className="flex items-center gap-1 font-bold text-white">
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                {Math.ceil(hp)} / {maxHp}
              </span>
              <span>6-HIT PRO HP</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-900 border border-neutral-700 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-200 ${
                  hpPercent > 60
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : hpPercent > 30
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
              {/* Bullet segment markers */}
              {[16.6, 33.3, 50, 66.6, 83.3].map((pos) => (
                <div
                  key={pos}
                  className="absolute top-0 bottom-0 w-[1px] bg-black/50"
                  style={{ left: `${pos}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Enter Vehicle Button Prompt */}
        {nearVehicle && (
          <button
            onClick={onEnterVehicle}
            className="pointer-events-auto bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-black px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-bounce cursor-pointer flex items-center space-x-1.5"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>DRIVE VEHICLE</span>
          </button>
        )}
      </div>

      {/* Healing Action Indicator */}
      {isHealing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/50">
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
            <Heart className="w-4 h-4 animate-pulse fill-emerald-400" />
            <span>APPLYING MEDKIT...</span>
          </div>
          <div className="w-36 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
            <div
              className="h-full bg-emerald-400 transition-all duration-75"
              style={{ width: `${healProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Precision Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none flex items-center justify-center z-10">
        <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_6px_#00f5d4]" />
        <div className="absolute top-0 w-[1.5px] h-2 bg-cyan-400/90" />
        <div className="absolute bottom-0 w-[1.5px] h-2 bg-cyan-400/90" />
        <div className="absolute left-0 h-[1.5px] w-2 bg-cyan-400/90" />
        <div className="absolute right-0 h-[1.5px] w-2 bg-cyan-400/90" />
      </div>

      {/* Touch Controls (Joystick + Action Buttons) */}
      <div className="flex items-end justify-between pb-2">
        {/* Left Joystick */}
        <div
          onTouchStart={onJoystickStart}
          onTouchMove={onJoystickMove}
          onTouchEnd={onJoystickEnd}
          className="pointer-events-auto relative w-28 h-28 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center touch-none"
        >
          <div
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-white/90 to-neutral-200 shadow-[0_0_15px_rgba(255,255,255,0.6)] pointer-events-none"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
            }}
          />
        </div>

        {/* Right Buttons: Jump & Fire (With Touch-Aim Dragging) */}
        <div className="flex flex-col items-end space-y-3">
          <button
            onClick={onJump}
            className="pointer-events-auto w-14 h-14 rounded-full bg-white/20 active:bg-cyan-400 active:text-black border-2 border-white/60 text-white font-extrabold text-xs uppercase flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
          >
            JUMP
          </button>

          <div
            onTouchStart={onStartFire}
            onTouchEnd={onEndFire}
            onMouseDown={onStartFire}
            onMouseUp={onEndFire}
            className="pointer-events-auto w-20 h-20 rounded-full bg-gradient-to-tr from-red-600/60 to-red-500/80 active:from-red-500 active:to-amber-400 border-2 border-white text-white font-black text-sm uppercase flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] transition active:scale-95 cursor-pointer touch-none"
          >
            FIRE
          </div>
        </div>
      </div>
    </div>
  );
};
