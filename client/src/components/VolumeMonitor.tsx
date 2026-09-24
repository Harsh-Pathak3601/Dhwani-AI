import React from 'react';
import { motion } from 'framer-motion';

interface VolumeMonitorProps {
  isRecording: boolean;
}

const VolumeMonitor: React.FC<VolumeMonitorProps> = ({ isRecording }) => {
  /**
   * Volume Wave Generation:
   * Iterates over an array of 7 elements to render vertical bars.
   * Uses randomized Framer Motion scale heights (`Math.random() * 24 + 8`) and dynamic 
   * opacity parameters to simulate an active microphone volume level indicator.
   */
  const bars = Array.from({ length: 7 });

  return (
    <div className="flex items-end justify-center gap-[3px] h-8 w-16">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary"
          initial={{ height: '4px', opacity: 0.3 }}
          animate={
            isRecording
              ? {
                  height: ['4px', `${Math.random() * 24 + 8}px`, '4px'],
                  opacity: [0.5, 1, 0.5],
                }
              : { height: '4px', opacity: 0.3 }
          }
          transition={
            isRecording
              ? {
                  duration: 0.4 + Math.random() * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
          style={{
            boxShadow: isRecording ? '0 0 8px rgba(29, 158, 117, 0.4)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default VolumeMonitor;
