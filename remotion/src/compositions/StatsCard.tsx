import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MusicWave } from '../components/MusicWave';

const Stat: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  return (
    <div style={{ textAlign: 'center', transform: `scale(${s})`, opacity: s }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 110, color: '#f5a623', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, color: '#fff', marginTop: 6, letterSpacing: 2 }}>{label.toUpperCase()}</div>
    </div>
  );
};

export const StatsCard: React.FC = () => {
  const frame = useCurrentFrame();
  const waveOp = interpolate(frame, [60, 90, 120], [0, 1, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 40 }}>
        <Stat value="120,000+" label="YouTube subscribers" delay={0} />
        <Stat value="4,450+" label="Original compositions" delay={18} />
        <Stat value="30+ countries" label="Online students" delay={36} />
      </div>
      <div style={{ opacity: waveOp, display: 'flex', justifyContent: 'center' }}>
        <MusicWave width={900} height={120} bars={30} />
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 36, color: '#fff' }}>Nathaniel School of Music</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, color: '#f5a623', marginTop: 6 }}>music@nathanielschool.com</div>
      </div>
    </AbsoluteFill>
  );
};
