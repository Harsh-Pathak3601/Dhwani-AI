import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className={`relative w-full max-w-[320px] min-[380px]:max-w-[348px] sm:max-w-[364px] mx-auto select-none ${className}`}>

      {/* ── 3D Ambient Drop Shadow & Cyber Accent Aura (Grounds phone realistically) ── */}
      <div className="absolute -inset-2 rounded-[58px] bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-2xl opacity-70 pointer-events-none -z-10" />

      {/* ── Flagship Aerospace Titanium Chassis (Precision CNC Machined 3D Frame) ── */}
      <div className="relative rounded-[52px] p-[9px] bg-gradient-to-b from-[#3D4B5E] via-[#1E2734] to-[#121922] border-[2px] border-[#55677E]/80 ring-1 ring-black/90 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.95),0_15px_30px_-5px_rgba(0,0,0,0.8),inset_0_1.5px_2px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.85)]">

        {/* Outer Specular Chamfer Highlight (Diamond-Cut Metallic Bevel) */}
        <div className="absolute inset-[1px] rounded-[50px] border border-white/[0.12] pointer-events-none" />


        {/* ── Top Micro-Acoustic Speaker Ear-piece Slit ── */}
        <div className="relative w-12 h-[3.5px] bg-[#080C12] rounded-full mx-auto mb-1 border border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
          <div className="w-8 h-[1px] bg-white/30 rounded-full" />
        </div>

        {/* ── Display Bezel & Deep AMOLED OLED Screen (Stable Fixed Chassis Height) ── */}
        <div className={`w-full rounded-[44px] overflow-hidden bg-[#070D16] border border-white/[0.12] ring-1 ring-black flex flex-col relative shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] h-[620px] ${screenClassName}`}>

          {/* Ceramic Shield Glass Reflection (Diagonal studio sheen across upper quadrant) */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.045] via-transparent to-transparent pointer-events-none z-20" />
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-radial from-white/[0.04] to-transparent rounded-full pointer-events-none z-20 blur-md" />

          {/* ── Realistic iOS / Flagship Status Bar (Grid Layout, ZERO Overlap) ── */}
          <div className="relative h-12 px-6 pt-2.5 shrink-0 z-30 pointer-events-none grid grid-cols-3 items-center">

            {/* Left: Clock */}
            <div className="flex items-center justify-start">
              <span className="font-sans text-[12.5px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {time}
              </span>
            </div>

            {/* Center: Single Flagship Punch-Hole Camera (Concentric Bezel, Sapphire Blue-Amber Optical Glint) */}
            <div className="flex justify-center items-center">
              <div
                className="w-4 h-4 rounded-full bg-[#03070E] ring-[1.5px] ring-black/95 border border-white/[0.15] relative flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(0,0,0,0.95)]"
                title="Punch-Hole Camera"
              >
                {/* Concentric Optical Element Ring */}
                <div className="w-[12px] h-[12px] rounded-full bg-[#060D18] ring-1 ring-[#1E3045]/85 flex items-center justify-center relative overflow-hidden">
                  {/* Multi-layer AR Sapphire Coating (Deep blue-cyan to warm amber gradient as in photo) */}
                  <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-[#0C3252] via-[#164472] to-[#8C521A] opacity-95 shadow-inner" />
                  {/* Specular White Pinpoint Optical Glint at 2 o'clock */}
                  <div className="absolute top-[1.5px] right-[1.5px] w-[1px] h-[1px] bg-white rounded-full shadow-[0_0_2px_#ffffff]" />
                </div>
              </div>
            </div>

            {/* Right: Cellular Signal, 5G Badge, WiFi, Battery */}
            <div className="flex items-center justify-end gap-1.5 text-white/95">
              {/* Cellular 4-Bar Meter */}
              <div className="flex items-end gap-[1.5px] h-2.5">
                <span className="w-[2px] h-[3px] bg-white rounded-[0.5px]" />
                <span className="w-[2px] h-[5px] bg-white rounded-[0.5px]" />
                <span className="w-[2px] h-[7px] bg-white rounded-[0.5px]" />
                <span className="w-[2px] h-[9px] bg-white rounded-[0.5px]" />
              </div>

              {/* 5G Network Indicator */}
              <span className="text-[9px] font-sans font-black tracking-tighter text-white/80">5G</span>

              {/* WiFi Waves */}
              <Wifi className="w-3.5 h-3.5 stroke-[2.4]" />

              {/* Authentic iOS Battery Icon */}
              <div className="relative flex items-center ml-0.5">
                <div className="w-[21px] h-[10.5px] rounded-[3.5px] border-[1.2px] border-white/85 p-[1px] flex items-center bg-black/40">
                  <div className="w-[84%] h-full bg-white rounded-[1.8px]" />
                </div>
                <div className="w-[1.5px] h-[4.5px] bg-white/85 rounded-r-[1.2px] ml-[0.5px]" />
              </div>
            </div>

          </div>

          {/* ── Screen Content Body (Children) ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col z-10">
            {children}
          </div>

          {/* ── Home Indicator Bar (Precision Curved Pill) ── */}
          <div className="shrink-0 pt-1.5 pb-2.5 flex justify-center z-30 pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
            <div className="w-32 h-[4.5px] bg-white/45 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
