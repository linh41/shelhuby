'use client';
// Semi-circular gauge displaying storage health score 0-100
// Design: half-donut with gradient track (pink→orange→green), score text, quality badge

interface StorageScoreRingProps {
  score: number;
  size?: number;
}

// Quality tier based on score
function getQuality(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: 'Good', color: '#4CAF50', bg: '#2ECC7130' };
  if (score >= 40) return { label: 'Fair', color: '#F39C12', bg: '#F39C1230' };
  return { label: 'Poor', color: '#E74C3C', bg: '#E74C3C30' };
}

export function StorageScoreRing({ score, size = 150 }: StorageScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const quality = getQuality(clamped);

  // Gauge geometry — semi-circle (180°)
  const strokeWidth = size * 0.135;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Arc path: from left (180°) to right (0°) — top half
  const startX = centerX - radius;
  const startY = centerY;
  const endX = centerX + radius;
  const endY = centerY;

  // Full semi-circle track path
  const trackPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  // Semi-circle circumference = π × r
  const halfCircumference = Math.PI * radius;
  const progressLength = (clamped / 100) * halfCircumference;
  const progressOffset = halfCircumference - progressLength;

  // Unique gradient ID to avoid conflicts if multiple instances render
  const gradientId = `scoreGrad-${size}`;

  // Height is half the SVG since we only show top half + some padding for stroke
  const svgHeight = centerY + strokeWidth / 2;

  return (
    <div className="flex flex-col items-center" style={{ gap: 8 }}>
      {/* Gauge wrapper — positions text over the arc */}
      <div style={{ position: 'relative', width: size, height: svgHeight }}>
        <svg
          width={size}
          height={svgHeight}
          viewBox={`0 0 ${size} ${svgHeight}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradient matching .pen: pink → orange → green (left to right) */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF69B4" />
              <stop offset="45%" stopColor="#F39C12" />
              <stop offset="100%" stopColor="#2ECC71" />
            </linearGradient>
          </defs>

          {/* Track — faint pink background arc */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255, 105, 180, 0.13)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc with gradient */}
          <path
            d={trackPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            strokeDashoffset={progressOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        {/* Score text — centered in the arc */}
        <div
          style={{
            position: 'absolute',
            top: svgHeight * 0.38,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Funnel Sans', sans-serif",
              fontSize: size * 0.24,
              fontWeight: 700,
              lineHeight: 1,
              color: '#F5F0EB',
            }}
          >
            {clamped}
          </span>
          <span
            style={{
              fontFamily: "'Funnel Sans', sans-serif",
              fontSize: size * 0.067,
              color: '#A89888',
            }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Quality badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: quality.bg,
          borderRadius: 10,
          padding: '3px 10px',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: quality.color,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: "'Funnel Sans', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            color: quality.color,
          }}
        >
          {quality.label}
        </span>
      </div>

      {/* STORAGE SCORE label */}
      <span
        style={{
          fontFamily: "'Funnel Sans', sans-serif",
          fontSize: 9,
          fontWeight: 500,
          color: '#A89888',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        STORAGE SCORE
      </span>
    </div>
  );
}
