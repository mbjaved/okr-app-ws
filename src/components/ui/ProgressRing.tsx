// ProgressRing.tsx
// Modern, polished SVG progress ring for OKR cards (Best_Practices.md, Design_prompts)
import React from "react";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number; // px
  stroke?: number; // px
  color?: string;
  bgColor?: string;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 48,
  stroke = 6,
  color = "#2563eb", // blue-600
  bgColor = "#e5e7eb", // gray-200
  label,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const uniqueId = React.useId(); // For unique gradient IDs
  
  // Dynamic color based on progress for better visual feedback
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return { start: "#10b981", end: "#059669" }; // Green gradient for complete
    if (progress >= 75) return { start: "#3b82f6", end: "#1d4ed8" }; // Blue gradient for on track
    if (progress >= 50) return { start: "#f59e0b", end: "#d97706" }; // Orange gradient for at risk
    return { start: "#ef4444", end: "#dc2626" }; // Red gradient for off track
  };
  
  const progressColors = getProgressColor(progress);
  
  return (
    <div className="relative inline-block">
      <svg
        width={size}
        height={size}
        className="block transform transition-transform duration-300 hover:scale-105"
        role="img"
        aria-label={label ? `${label}: ${progress}%` : `${progress}% complete`}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`progress-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={progressColors.start} />
            <stop offset="100%" stopColor={progressColors.end} />
          </linearGradient>
          {/* Subtle glow effect - reduced blur for crisp appearance */}
          <filter id={`glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle with subtle inner shadow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={stroke}
          opacity="0.3"
        />
        
        {/* Progress circle with gradient and subtle glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-gradient-${uniqueId})`}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={progress > 0 && progress < 100 ? `url(#glow-${uniqueId})` : "none"}
          style={{ 
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            transformOrigin: '50% 50%',
            transform: 'rotate(-90deg)'
          }}
        />
        
        {/* Center text with improved typography */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          fontSize={size * 0.28}
          className="fill-gray-700 font-bold transition-colors duration-300"
          style={{ 
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            letterSpacing: '-0.02em'
          }}
        >
          {Math.round(progress)}%
        </text>
        

      </svg>
      

    </div>
  );
};
