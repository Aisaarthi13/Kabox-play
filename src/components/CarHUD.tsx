import React from 'react';
import { Camera, LogOut, Flame, ShieldAlert, Volume2, Sparkles, Navigation } from 'lucide-react';
import { CameraView } from '../types';

interface CarHUDProps {
  speed: number;        // KM/H
  rpm: number;          // 0 to 7000
  gear: string;         // '1', '2', '3', '4', '5', '6', 'R', 'P'
  nosAmount: number;    // 0 to 100
  isNitroActive: boolean;
  driftScore: number;
  isDrifting: boolean;
  vehicleArmor: number;
  maxVehicleArmor: number;
  cameraView: CameraView;
  onChangeCamera: () => void;
  onExitVehicle: () => void;
  onGasStart: () => void;
  onGasEnd: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
  onSteerLeftStart: () => void;
  onSteerLeftEnd: () => void;
  onSteerRightStart: () => void;
  onSteerRightEnd: () => void;
  onDriftStart: () => void;
  onDriftEnd: () => void;
  onNitroStart: () => void;
  onNitroEnd: () => void;
  onHorn: () => void;
}

export const CarHUD: React.FC<CarHUDProps> = ({
  speed,
  rpm,
  gear,
  nosAmount,
  isNitroActive,
  driftScore,
  isDrifting,
  vehicleArmor,
  maxVehicleArmor,
  cameraView,
  onChangeCamera,
  onExitVehicle,
  onGasStart,
  onGasEnd,
  onBrakeStart,
  onBrakeEnd,
  onSteerLeftStart,
  onSteerLeftEnd,
  onSteerRightStart,
  onSteerRightEnd,
  onDriftStart,
  onDriftEnd,
  onNitroStart,
  onNitroEnd,
  onHorn
}) => {
  const displaySpeed = Math.abs(Math.round(speed));
  const rpmPercent = Math.min(100, (rpm / 7000) * 100);
  const armorPercent = Math.max(0, Math.min(100, (vehicleArmor / maxVehicleArmor) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none font-sans">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between">
        {/* Speedometer & RPM Box */}
        <div className="bg-black/80 backdrop-blur-md p-2.5 rounded-2xl border border-cyan-500/40 text-white min-w-[150px] shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tight leading-none">
              {displaySpeed}
            </span>
            <span className="text-xs font-extrabold text-neutral-400 uppercase">KM/H</span>
            <span className="ml-auto bg-amber-400 text-black px-1.5 py-0.5 rounded font-black text-xs uppercase">
              GEAR {gear}
            </span>
          </div>

          {/* RPM Gauge */}
          <div className="mt-1.5">
            <div className="flex justify-between text-[9px] text-neutral-400 font-bold mb-0.5">
              <span>RPM</span>
              <span>{Math.round(rpm)}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-900 border border-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  rpm > 6000 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>
          </div>

          {/* NOS Gauge */}
          <div className="mt-1">
            <div className="flex justify-between text-[9px] text-amber-400 font-bold mb-0.5">
              <span className="flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                NITRO NOS
              </span>
              <span>{Math.round(nosAmount)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-900 border border-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75"
                style={{ width: `${nosAmount}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Drift Score Indicator */}
        {isDrifting && (
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400 px-4 py-1.5 rounded-full text-center shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce">
            <div className="text-[10px] font-bold uppercase text-amber-300 tracking-widest flex items-center justify-center gap-1">
              <Navigation className="w-3 h-3 text-amber-400" />
              <span>DRIFTING!</span>
            </div>
            <div className="text-lg font-black text-white">+{driftScore} PTS</div>
          </div>
        )}

        {/* Camera & Exit Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onChangeCamera}
            className="pointer-events-auto bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 p-2.5 rounded-xl border border-neutral-700 transition cursor-pointer flex items-center justify-center"
            title="Change Camera View"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onHorn}
            className="pointer-events-auto bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 p-2.5 rounded-xl border border-neutral-700 transition cursor-pointer flex items-center justify-center"
            title="Vehicle Horn"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onExitVehicle}
            className="pointer-events-auto bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-xl border border-red-500 font-bold text-xs uppercase flex items-center space-x-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Nitro Screen Effect Indicator */}
      {isNitroActive && (
        <div className="absolute inset-0 pointer-events-none border-4 border-amber-400/30 rounded-2xl animate-pulse shadow-[inset_0_0_50px_rgba(245,158,11,0.4)]" />
      )}

      {/* Bottom Driving Touch Controls */}
      <div className="flex items-end justify-between pb-2">
        {/* Steering Buttons Left / Right */}
        <div className="flex items-center space-x-2">
          <button
            onTouchStart={onSteerLeftStart}
            onTouchEnd={onSteerLeftEnd}
            onMouseDown={onSteerLeftStart}
            onMouseUp={onSteerLeftEnd}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-neutral-900/80 active:bg-cyan-400 active:text-black border-2 border-neutral-700 text-white font-black text-xl flex items-center justify-center shadow-lg transition cursor-pointer touch-none"
          >
            ◄
          </button>

          <button
            onTouchStart={onSteerRightStart}
            onTouchEnd={onSteerRightEnd}
            onMouseDown={onSteerRightStart}
            onMouseUp={onSteerRightEnd}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-neutral-900/80 active:bg-cyan-400 active:text-black border-2 border-neutral-700 text-white font-black text-xl flex items-center justify-center shadow-lg transition cursor-pointer touch-none"
          >
            ►
          </button>
        </div>

        {/* Center Drift & Nitro Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onTouchStart={onDriftStart}
            onTouchEnd={onDriftEnd}
            onMouseDown={onDriftStart}
            onMouseUp={onDriftEnd}
            className="pointer-events-auto px-3.5 py-3 rounded-2xl bg-amber-500/30 active:bg-amber-400 active:text-black border-2 border-amber-400 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center space-x-1 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition cursor-pointer touch-none"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>DRIFT</span>
          </button>

          <button
            onTouchStart={onNitroStart}
            onTouchEnd={onNitroEnd}
            onMouseDown={onNitroStart}
            onMouseUp={onNitroEnd}
            className="pointer-events-auto px-3.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 active:scale-95 text-black font-black text-xs uppercase tracking-wider flex items-center space-x-1 shadow-[0_0_20px_rgba(245,158,11,0.6)] transition cursor-pointer touch-none"
          >
            <Flame className="w-4 h-4 fill-black" />
            <span>NOS</span>
          </button>
        </div>

        {/* Gas & Brake Pedals */}
        <div className="flex items-center space-x-2">
          <button
            onTouchStart={onBrakeStart}
            onTouchEnd={onBrakeEnd}
            onMouseDown={onBrakeStart}
            onMouseUp={onBrakeEnd}
            className="pointer-events-auto w-12 h-16 rounded-2xl bg-red-600/30 active:bg-red-600 active:text-white border-2 border-red-500 text-red-300 font-black text-xs uppercase flex items-center justify-center shadow-lg transition cursor-pointer touch-none"
          >
            BRAKE
          </button>

          <button
            onTouchStart={onGasStart}
            onTouchEnd={onGasEnd}
            onMouseDown={onGasStart}
            onMouseUp={onGasEnd}
            className="pointer-events-auto w-14 h-20 rounded-2xl bg-gradient-to-t from-emerald-600 to-teal-400 active:from-emerald-400 active:to-teal-200 text-black font-black text-sm uppercase flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] transition cursor-pointer touch-none"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
