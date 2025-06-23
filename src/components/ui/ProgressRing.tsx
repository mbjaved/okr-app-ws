// ProgressRing.tsx
// Modular, accessible SVG progress ring for OKR cards (Best_Practices.md, Design_prompts)
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
  return (
    <svg
      width={size}
      height={size}
      className="block"
      role="img"
      aria-label={label ? `${label}: ${progress}%` : `${progress}% complete`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,1,.7,1)' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        fontSize={size * 0.32}
        className="fill-gray-800 font-semibold"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};
