import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedTitle } from './AnimatedTitle';
import { MusicWave } from './MusicWave';

export const LogoReveal: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity: 0.3 }}>
        <MusicWave width={1200} height={200} color="#e94560" />
      </div>
      <div style={{ marginTop: -100 }}>
        <AnimatedTitle text={text} size={86} family="Playfair Display, Georgia, serif" />
      </div>
    </AbsoluteFill>
  );
};
