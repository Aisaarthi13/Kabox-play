import React, { useState } from 'react';
import { GameMode, VehicleType, VehicleConfig } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { Play, Shield, Flame, Gauge, Sparkles, Navigation, Crosshair, Trophy } from 'lucide-react';

interface StartMenuProps {
  onStartGame: (mode: GameMode, vehicle: VehicleType, paintHex: number) => void;
}

export const VEHICLES: VehicleConfig[] = [
  {
    id: 'apex_gt',
    name: 'Apex GT Supercar',
    tagline: 'Extreme drift control & 280 KM/H top speed',
    topSpeed: 280,
    acceleration: 95,
    driftFactor: 98,
    armor: 60,
    color: 'Flame Red',
    paintHex: 0xd62828,
    icon: '🏎️'
  },
  {
    id: 'cyber_suv',
    name: 'Cyber Raptor SUV',
    tagline: 'Heavy armored off-road machine with high suspension',
    topSpeed: 210,
    acceleration: 80,
    driftFactor: 75,
    armor: 100,
    color: 'Cyber Cyan',
    paintHex: 0x00f5d4,
    icon: '🚙'
  },
  {
    id: 'phantom_buggy',
    name: 'Phantom Buggy',
    tagline: 'Ultra lightweight dune buggy built for massive ramp jumps',
    topSpeed: 240,
    acceleration: 98,
    driftFactor: 88,
    armor: 50,
    color: 'Electric Gold',
    paintHex: 0xffb703,
    icon: '🏎️'
  },
  {
    id: 'combat_truck',
    name: 'Armored Combat Truck',
    tagline: '8x8 Monster with heavy plating & mounted turret fire',
    topSpeed: 180,
    acceleration: 70,
    driftFactor: 60,
    armor: 150,
    color: 'Midnight Black',
    paintHex: 0x1d3557,
    icon: '🚚'
  }
];

export const COLOR_OPTIONS = [
  { name: 'Red', hex: 0xd62828, bg: 'bg-red-600' },
  { name: 'Cyan', hex: 0x00f5d4, bg: 'bg-teal-400' },
  { name: 'Gold', hex: 0xffb703, bg: 'bg-amber-400' },
  { name: 'Black', hex: 0x111827, bg: 'bg-neutral-900' },
  { name: 'Purple', hex: 0x7209b7, bg: 'bg-purple-600' }
];

export const StartMenu: React.FC<StartMenuProps> = ({ onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('warfare');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('apex_gt');
  const [selectedColor, setSelectedColor] = useState<number>(VEHICLES[0].paintHex);

  const activeVehConfig = VEHICLES.find(v => v.id === selectedVehicle) || VEHICLES[0];

  const handleStart = () => {
    soundEngine.playUIClick();
    onStartGame(selectedMode, selectedVehicle, selectedColor);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 bg-gradient-to-b from-neutral-950/95 via-black/90 to-neutral-950/95 backdrop-blur-md text-white overflow-y-auto font-sans">
      {/* Top Banner Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>9:16 PRO EDITION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 uppercase drop-shadow-lg">
          Jungle Warfare
        </h1>
        <h2 className="text-sm sm:text-base font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
          <span>& Pro Driving Simulation</span>
        </h2>
      </div>

      {/* Mode Selector */}
      <div className="my-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Select Game Mode</span>
        </label>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => { setSelectedMode('warfare'); soundEngine.playUIClick(); }}
            className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center ${
              selectedMode === 'warfare'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <Crosshair className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xs font-bold uppercase leading-tight">Warfare</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">FPS + Drive</span>
          </button>

          <button
            onClick={() => { setSelectedMode('stunt_arena'); soundEngine.playUIClick(); }}
            className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center ${
              selectedMode === 'stunt_arena'
                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <Flame className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-xs font-bold uppercase leading-tight">Pro Stunt</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">Mega Ramps</span>
          </button>

          <button
            onClick={() => { setSelectedMode('drift_track'); soundEngine.playUIClick(); }}
            className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center ${
              selectedMode === 'drift_track'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <Navigation className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs font-bold uppercase leading-tight">Drift Arena</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">Power Slide</span>
          </button>
        </div>
      </div>

      {/* Vehicle Garage Selector */}
      <div className="my-1">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Pro Vehicle</span>
          </label>

          {/* Color Switcher */}
          <div className="flex items-center space-x-1">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.name}
                onClick={() => { setSelectedColor(c.hex); soundEngine.playUIClick(); }}
                className={`w-4 h-4 rounded-full border ${c.bg} ${
                  selectedColor === c.hex ? 'ring-2 ring-white scale-110 border-white' : 'border-neutral-700 opacity-60'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {VEHICLES.map(v => (
            <button
              key={v.id}
              onClick={() => {
                setSelectedVehicle(v.id);
                setSelectedColor(v.paintHex);
                soundEngine.playUIClick();
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                selectedVehicle === v.id
                  ? 'bg-gradient-to-br from-neutral-900 to-neutral-800 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{v.icon}</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {v.topSpeed} KM/H
                </span>
              </div>
              <div className="font-bold text-xs text-white truncate">{v.name}</div>
              <div className="text-[9px] text-neutral-400 line-clamp-1 mt-0.5">{v.tagline}</div>
            </button>
          ))}
        </div>

        {/* Selected Vehicle Stats */}
        <div className="mt-2 bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 text-xs">
          <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
            <span>{activeVehConfig.name} Specs</span>
            <span className="text-emerald-400">Pro Tuning Level 5</span>
          </div>

          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Top Speed</span>
                <span>{activeVehConfig.topSpeed} KM/H</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${(activeVehConfig.topSpeed / 300) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Drift & Handling</span>
                <span>{activeVehConfig.driftFactor}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${activeVehConfig.driftFactor}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-extrabold text-base tracking-widest uppercase shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>START PRO GAME (9:16)</span>
        </button>

        <p className="text-center text-[10px] text-neutral-500 mt-2">
          Portrait 9:16 Optimized • Touch & Keyboard Supported
        </p>
      </div>
    </div>
  );
};
