import React from 'react';
import { useCurrentFrame } from 'remotion';

export const MusicWave: React.FC<{ bars?: number; color?: string; height?: number; width?: number }> = ({
  bars = 40, color = '#e94560', height = 120, width = 800,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const phase = (frame + i * 4) * 0.12;
        const amp = Math.abs(Math.sin(phase)) * (height * 0.4) + (height * 0.1);
        const x = (i / bars) * width;
        return (
          <rect
            key={i}
            x={x}
            y={(height - amp) / 2}
            width={width / bars - 4}
            height={amp}
            rx={3}
            fill={color}
            opacity={0.6 + Math.sin(phase) * 0.4}
          />
        );
      })}
    </svg>
  );
};
