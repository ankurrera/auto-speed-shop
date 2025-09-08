import React from 'react';

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

/**
 * Circular gauge component for displaying metrics like speed, RPM, battery level, etc.
 */
const Gauge: React.FC<GaugeProps> = ({
  value,
  max,
  label,
  unit,
  size = 160,
  strokeWidth = 8,
  color = 'hsl(var(--success))',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <div className={`gauge-container ${className}`} style={{ width: size, height: size }}>
      <svg
        className="gauge-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${label}: ${value} ${unit}`}
      >
        {/* Background track */}
        <circle
          className="gauge-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          className="gauge-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ stroke: color }}
        />
      </svg>
      <div className="gauge-label">
        <div className="text-2xl font-bold">
          {Math.round(value)}
        </div>
        <div className="text-sm text-muted-foreground">
          {unit}
        </div>
        <div className="text-xs text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
};

export default Gauge;