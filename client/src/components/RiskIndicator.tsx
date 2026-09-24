import { motion } from 'framer-motion';

interface RiskIndicatorProps {
  peakRiskScore: number;
  currentRiskScore: number;
}

const RiskIndicator = ({ peakRiskScore, currentRiskScore }: RiskIndicatorProps) => {
  // SVG Gauge Math:
  // Circular perimeter is computed as 2 * pi * r (where r = 36).
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  
  // We slice this to a 75% arc gauge to mimic an analog speedometer layout.
  // The bottom 25% of the circle is left empty.
  const gaugeLength = circumference * 0.75;
  
  // Clamp risk scores between 0 and 100 to prevent math anomalies
  const validCurrentRisk = Math.min(100, Math.max(0, currentRiskScore || 0));
  const validPeakRisk = Math.min(100, Math.max(0, peakRiskScore || 0));

  const dashoffset = gaugeLength - (validCurrentRisk / 100) * gaugeLength;

  const getColor = (score: number) => {
    if (score >= 80) return '#E24B4A';
    if (score >= 40) return '#EF9F27';
    return '#1D9E75';
  };

  const currentColor = getColor(validCurrentRisk);
  const isHighRisk = validCurrentRisk >= 40 || validPeakRisk >= 40;

  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      <div className="relative flex items-center justify-center">

        <svg className="w-24 h-24 transform -rotate-[135deg]" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            strokeDasharray={`${gaugeLength} ${circumference}`}
            strokeLinecap="round"
          />

          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={currentColor}
            strokeWidth="8"
            strokeDasharray={`${gaugeLength} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: gaugeLength }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${currentColor}80)`
            }}
          />
        </svg>


        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            key={currentRiskScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold tracking-tighter"
            style={{ color: currentColor }}
          >
            {currentRiskScore}
          </motion.span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider mt-[-2px]">Risk</span>
        </div>
      </div>

      {isHighRisk && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 right-0"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: currentColor }}></span>
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: currentColor }}></span>
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default RiskIndicator;
