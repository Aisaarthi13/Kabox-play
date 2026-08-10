import React, { useState } from 'react';
import { Maximize2, Minimize2, Smartphone, Shield, Sparkles } from 'lucide-react';

interface AspectContainerProps {
  children: React.ReactNode;
  title?: string;
}

export const AspectContainer: React.FC<AspectContainerProps> = ({
  children,
  title = 'Jungle Warfare & Pro Driving'
}) => {
  const [isFullscreenFrame, setIsFullscreenFrame] = useState(false);

  return (
    <div className="relative w-full h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none text-white">
      {/* Ambient Blurred Background for aesthetic depth */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-3xl scale-110 pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(0,0,0,0.95) 100%)`
        }}
      />

      {/* Header bar on large screens */}
      <header className="hidden md:flex absolute top-3 left-6 right-6 z-50 items-center justify-between text-xs text-neutral-400 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-full px-5 py-2.5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>9:16 Portrait Mode</span>
          </div>
          <span className="font-bold text-neutral-200 text-sm">{title}</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-neutral-400 text-xs">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pro Driving Physics & Drift Enabled</span>
          </div>
          <button
            onClick={() => setIsFullscreenFrame(!isFullscreenFrame)}
            className="flex items-center space-x-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1 rounded-full border border-neutral-700 transition cursor-pointer"
            title="Toggle 9:16 Device Frame / Full Width"
          >
            {isFullscreenFrame ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">{isFullscreenFrame ? 'Frame View' : 'Fill View'}</span>
          </button>
        </div>
      </header>

      {/* Main Aspect Ratio Frame */}
      <div
        className={`relative transition-all duration-300 flex items-center justify-center ${
          isFullscreenFrame
            ? 'w-full h-full max-w-lg aspect-[9/16]'
            : 'h-[94vh] max-h-[920px] aspect-[9/16] rounded-[28px] border-[3px] border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden bg-black'
        }`}
      >
        {/* Phone Notch/Speaker simulation on device frame mode */}
        {!isFullscreenFrame && (
          <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-900 border border-neutral-800 rounded-full z-50 pointer-events-none flex items-center justify-center">
            <div className="w-10 h-1 bg-neutral-800 rounded-full" />
            <div className="absolute right-3 w-2 h-2 rounded-full bg-emerald-500/60" />
          </div>
        )}

        {/* Game Canvas Container */}
        <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Footer Instructions on Desktop */}
      <footer className="hidden md:block absolute bottom-2 text-center text-[11px] text-neutral-500 tracking-wider uppercase font-medium">
        WASD / Touch Joystick to Drive & Move • Space / Drift Button to Power Slide • Shift / NOS for Nitro Boost
      </footer>
    </div>
  );
};
