'use client';

export default function RingProgress({ 
  percentage, 
  color = 'var(--primary)', 
  size = 64, 
  strokeWidth = 6 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap percentage at 100 for visual rendering
  const clampedPercentage = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background Ring */}
      <svg className="h-full w-full -rotate-90 transform">
        <circle
          className="text-muted/50"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Ring */}
        <circle
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            color: color,
            transition: 'stroke-dashoffset 1s ease-out',
          }}
          className="drop-shadow-sm"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Percentage Text Centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-xs font-semibold tabular-nums">
          {clampedPercentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
