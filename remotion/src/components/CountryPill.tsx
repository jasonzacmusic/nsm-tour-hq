import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const CountryPill: React.FC<{ label: string; delay?: number; x?: number; y?: number; color?: string }> = ({
  label, delay = 0, x = 50, y = 50, color = '#f5a623',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      background: color, color: '#1a1a2e',
      padding: '8px 20px', borderRadius: 999,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22,
      boxShadow: '0 4px 24px rgba(245,166,35,0.4)', opacity: scale,
    }}>{label}</div>
  );
};
