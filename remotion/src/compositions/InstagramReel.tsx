import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

type Props = { cityName: string; clusterName: string; topics: string[] };

const Hook: React.FC<{ cityName: string }> = ({ cityName }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12, 70, 90], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80, opacity: op, background: '#1a1a2e' }}>
      <div style={{ textAlign: 'center', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 84, color: '#fff', lineHeight: 1.15 }}>
        A musician from Bangalore is coming to{' '}
        <span style={{ color: '#f5a623' }}>{cityName}</span>
      </div>
    </AbsoluteFill>
  );
};

const Topics: React.FC<{ topics: string[] }> = ({ topics }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, color: '#f5a623', letterSpacing: 3, marginBottom: 40 }}>WHAT I TEACH</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
        {topics.map((t, i) => {
          const scale = spring({ frame: frame - i * 3, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              background: '#f5a623', color: '#1a1a2e', padding: '12px 32px', borderRadius: 999,
              fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 600,
              transform: `scale(${scale})`, opacity: scale,
            }}>{t}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', padding: 80 }}>
      <div style={{ textAlign: 'center', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 76, color: '#fff', opacity: op, lineHeight: 1.3 }}>
        "No agenda.<br />No fixed dates.<br />Just music."
      </div>
    </AbsoluteFill>
  );
};

const Contact: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', padding: 80 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, color: '#f5a623', marginBottom: 24 }}>music@nathanielschool.com</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, color: '#fff', marginBottom: 12 }}>@nathanielschoolofmusic</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, color: '#fff' }}>youtube.com/nathanielschool</div>
    </div>
  </AbsoluteFill>
);

const MontagePlaceholder: React.FC<{ idx: number }> = ({ idx }) => {
  const colors = [['#0f3460', '#e94560'], ['#16213e', '#f5a623'], ['#1a1a2e', '#27ae60']];
  const [a, b] = colors[idx % colors.length];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${a}, ${b})`, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 200, color: 'rgba(255,255,255,0.15)' }}>JZ</div>
    </AbsoluteFill>
  );
};

export const InstagramReel: React.FC<Props> = ({ cityName, topics }) => {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      <Sequence from={0} durationInFrames={90}><Hook cityName={cityName} /></Sequence>
      <Sequence from={90} durationInFrames={90}><MontagePlaceholder idx={0} /></Sequence>
      <Sequence from={180} durationInFrames={90}><MontagePlaceholder idx={1} /></Sequence>
      <Sequence from={270} durationInFrames={90}><MontagePlaceholder idx={2} /></Sequence>
      <Sequence from={360} durationInFrames={240}><Topics topics={topics} /></Sequence>
      <Sequence from={600} durationInFrames={210}><Quote /></Sequence>
      <Sequence from={810} durationInFrames={90}><Contact /></Sequence>
    </AbsoluteFill>
  );
};
