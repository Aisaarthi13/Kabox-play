import React from 'react';
import { RotateCcw, Trophy, Skull, Flame, Zap } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameOverModalProps {
  wave: number;
  kills: number;
  driftScore: number;
  topSpeed: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  wave,
  kills,
  driftScore,
  topSpeed,
  onRestart
}) => {
  const handleRestart = () => {
    soundEngine.playUIClick();
    onRestart();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white select-none">
      <div className="w-full max-w-xs bg-neutral-900/90 border-2 border-red-500/80 rounded-3xl p-5 text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs uppercase mb-2">
          <Skull className="w-4 h-4" />
          <span>K.I.A / MISSION COMPLETE</span>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-400 uppercase tracking-wider mb-4">
          DEBRIEF
        </h2>

        <div className="space-y-2.5 text-left bg-black/60 border border-neutral-800 rounded-2xl p-3.5 mb-5 text-xs">
          <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Waves Survived
            </span>
            <span className="font-extrabold text-white text-sm">{wave}</span>
          </div>

          <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-emerald-400" />
              Total Enemy Kills
            </span>
            <span className="font-extrabold text-white text-sm">{kills}</span>
          </div>

          <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Total Drift Score
            </span>
            <span className="font-extrabold text-amber-400 text-sm">+{driftScore} PTS</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Top Speed Reached
            </span>
            <span className="font-extrabold text-cyan-400 text-sm">{Math.round(topSpeed)} KM/H</span>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>REDEPLOY / PLAY AGAIN</span>
        </button>
      </div>
    </div>
  );
};
