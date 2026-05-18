import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const AnimatedTitle: React.FC<{ text: string; delay?: number; size?: number; color?: string; family?: string }> = ({
  text, delay = 0, size = 90, color = '#fff', family = 'Playfair Display, Georgia, serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      {text.split('').map((ch, i) => {
        const local = Math.max(0, frame - delay - i * 2);
        const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
        const y = interpolate(local, [0, 18], [16, 0], { extrapolateRight: 'clamp' });
        return (
          <span key={i} style={{
            display: 'inline-block', fontFamily: family, fontWeight: 700, fontSize: size, color,
            opacity, transform: `translateY(${y}px)`, whiteSpace: 'pre',
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>{ch === ' ' ? ' ' : ch}</span>
        );
      })}
    </div>
  );
};
