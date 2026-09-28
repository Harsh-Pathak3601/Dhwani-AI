import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  isCallActive?: boolean;
}

export default function MobileDeviceFrame({
  children,
  className = '',
  screenClassName = '',
  isCallActive = false,
}: MobileDeviceFrameProps) {
  const [time, setTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const formattedHours = hours % 12 || 12;
      setTime(`${formattedHours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full max-w-[350px] sm:max-w-[365px] mx-auto select-none ${className}`}>
      {/* Outer Metallic Chassis Frame (6.3" phone profile with titanium edge) */}
      <div className="relative rounded-[50px] p-[10px] bg-gradient-to-b from-[#2E3B4E] via-[#1B2533] to-[#111822] border-[2.5px] border-[#44566F]/70 ring-1 ring-black/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.12),inset_0_1px_2px_rgba(255,255,255,0.25)]">
        
        {/* Hardware Buttons - Left Side */}
        {/* Action Button */}
        <div className="absolute -left-[4px] top-24 w-[3.5px] h-7 bg-[#3E4F66] rounded-l-[2px] shadow-sm pointer-events-none" />
        {/* Volume Up */}
        <div className="absolute -left-[4px] top-36 w-[3.5px] h-12 bg-[#3E4F66] rounded-l-[2px] shadow-sm pointer-events-none" />
        {/* Volume Down */}
        <div className="absolute -left-[4px] top-52 w-[3.5px] h-12 bg-[#3E4F66] rounded-l-[2px] shadow-sm pointer-events-none" />

        {/* Hardware Buttons - Right Side */}
        {/* Power / Lock Button */}
        <div className="absolute -right-[4px] top-40 w-[3.5px] h-16 bg-[#3E4F66] rounded-r-[2px] shadow-sm pointer-events-none" />

        {/* Top Speaker Ear-piece Slit */}
        <div className="w-16 h-1 bg-[#121924] rounded-full mx-auto mb-1 opacity-80" />

        {/* Display Screen */}
        <div className={`w-full rounded-[40px] overflow-hidden bg-gradient-to-b from-[#09111C] via-[#08121E] to-[#060D17] border border-white/[0.08] flex flex-col relative shadow-inner min-h-[580px] max-h-[710px] ${screenClassName}`}>
          
          {/* iOS / Flagship Status Bar */}
          <div className="h-11 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold text-white/80 shrink-0 z-30 pointer-events-none">
            {/* Clock */}
            <span className="font-mono tracking-tight font-bold text-white/90">{time}</span>

            {/* Dynamic Island Pill */}
            <div className="w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-white/10 mx-auto -mr-2">
              {/* Front Camera Lens with Anti-Reflective Glint */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#111A26] border border-[#243346] relative flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-cyan-500/40" />
              </div>
              {/* Privacy Indicator or Sensor */}
              {isCallActive ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              )}
            </div>

            {/* Signal & Battery Icons */}
            <div className="flex items-center gap-1.5 text-white/80">
              <span className="text-[9px] font-mono font-bold tracking-tight text-white/60">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 fill-white/80" />
              </div>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="shrink-0 pt-2 pb-2.5 flex justify-center z-30 pointer-events-none bg-gradient-to-t from-black/40 to-transparent">
            <div className="w-32 h-1 bg-white/35 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
