'use client';
// SVG circular progress ring displaying storage health score 0-100
interface StorageScoreRingProps {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export function StorageScoreRing({ score, size = 96 }: StorageScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const color = scoreColor(clampedScore);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track — warm light color */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,105,180,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Score text — counter-rotate so it reads upright */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: color,
            fontSize: size * 0.22,
            fontWeight: 700,
            transform: `rotate(90deg)`,
            transformOrigin: `${center}px ${center}px`,
          }}
        >
          {clampedScore}
        </text>
      </svg>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Storage Score</span>
    </div>
  );
}
