import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = { clusterName: string; cities: string[]; institutionCount: number };

const Title: React.FC<{ name: string }> = ({ name }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 150, color: '#fff', letterSpacing: 4, opacity: op }}>{name}</div>
    </AbsoluteFill>
  );
};

const Route: React.FC<{ cities: string[] }> = ({ cities }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', padding: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
        {cities.map((c, i) => {
          const s = spring({ frame: frame - i * 14, fps, config: { damping: 14 } });
          return (
            <React.Fragment key={i}>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 56, fontWeight: 600,
                color: '#fff', opacity: s, transform: `scale(${s})`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ width: 16, height: 16, background: '#e94560', borderRadius: '50%' }} />
                {c}
              </div>
              {i < cities.length - 1 && (
                <span style={{
                  width: 60, height: 3, background: '#f5a623',
                  opacity: spring({ frame: frame - i * 14 - 8, fps, config: { damping: 14 } }),
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Summary: React.FC<{ count: number; citiesLen: number }> = ({ count, citiesLen }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
      <div style={{ textAlign: 'center', opacity: op }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 100, fontWeight: 700, color: '#f5a623' }}>
          {count} institutions · {citiesLen} cities
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, color: '#fff', marginTop: 24, letterSpacing: 2 }}>Workshop residencies available</div>
      </div>
    </AbsoluteFill>
  );
};

export const ClusterIntro: React.FC<Props> = ({ clusterName, cities, institutionCount }) => {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      <Sequence from={0} durationInFrames={150}><Title name={clusterName} /></Sequence>
      <Sequence from={150} durationInFrames={210}><Route cities={cities} /></Sequence>
      <Sequence from={360} durationInFrames={90}><Summary count={institutionCount} citiesLen={cities.length} /></Sequence>
    </AbsoluteFill>
  );
};
