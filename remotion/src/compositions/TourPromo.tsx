import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { LogoReveal } from '../components/LogoReveal';
import { MusicWave } from '../components/MusicWave';
import { CountryPill } from '../components/CountryPill';

type Props = {
  title: string;
  countries: string[];
  topics: string[];
};

const Stats: React.FC<{ items: { value: string; label: string }[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center' }}>
      {items.map((s, i) => {
        const delay = i * 18;
        const y = interpolate(frame - delay, [0, 24], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        const op = interpolate(frame - delay, [0, 24], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        return (
          <div key={i} style={{ transform: `translateY(${y}px)`, opacity: op, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 110, color: '#f5a623', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, color: '#fff', letterSpacing: 2, marginTop: 6 }}>{s.label.toUpperCase()}</div>
          </div>
        );
      })}
    </div>
  );
};

const Topics: React.FC<{ topics: string[] }> = ({ topics }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 18, justifyContent: 'center' }}>
      {topics.map((t, i) => {
        const scale = spring({ frame: frame - i * 8, fps, config: { damping: 14 } });
        return (
          <div key={i} style={{
            background: '#f5a623', color: '#1a1a2e', padding: '14px 28px',
            borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 28,
            transform: `scale(${scale})`, opacity: scale,
            boxShadow: '0 6px 30px rgba(245,166,35,0.4)',
          }}>{t}</div>
        );
      })}
    </div>
  );
};

const Map: React.FC<{ cities: string[] }> = ({ cities }) => {
  const grid = [
    { x: 30, y: 30 }, { x: 50, y: 32 }, { x: 70, y: 30 },
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 },
    { x: 30, y: 70 }, { x: 50, y: 72 }, { x: 70, y: 70 },
    { x: 40, y: 85 }, { x: 60, y: 85 },
  ];
  return (
    <AbsoluteFill>
      {cities.map((c, i) => {
        const pos = grid[i % grid.length];
        return <CountryPill key={i} label={c} delay={i * 8} x={pos.x} y={pos.y} />;
      })}
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeOut, padding: 80 }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 80, color: '#fff', marginBottom: 40 }}>Booking workshops for 2026</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, color: '#f5a623', marginBottom: 14 }}>music@nathanielschool.com</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, color: '#fff', marginBottom: 14 }}>+91 98454 65411 · WhatsApp</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, color: '#fff' }}>youtube.com/nathanielschool</div>
    </AbsoluteFill>
  );
};

export const TourPromo: React.FC<Props> = ({ title, countries, topics }) => {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      <Sequence from={0} durationInFrames={150}><LogoReveal text={title} /></Sequence>

      <Sequence from={150} durationInFrames={300}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
          <div style={{ width: 320, height: 320, borderRadius: '50%', background: 'linear-gradient(135deg,#0f3460,#e94560)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120, color: '#fff', fontFamily: 'Playfair Display, serif' }}>JZ</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 72, color: '#fff', fontWeight: 700 }}>Jason Zachariah</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, color: '#f5a623', marginTop: 12, letterSpacing: 2 }}>MULTI-INSTRUMENTALIST · EDUCATOR · COMPOSER</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, color: '#fff', marginTop: 6, opacity: 0.8 }}>Bangalore, India</div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={450} durationInFrames={300}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Stats items={[
            { value: '120,000+', label: 'YouTube subscribers' },
            { value: '4,450+', label: 'Original compositions' },
            { value: '30+ countries', label: 'Online students' },
            { value: '25 years', label: 'Performing & teaching' },
          ]} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={750} durationInFrames={450}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, color: '#f5a623', letterSpacing: 3, marginBottom: 50 }}>WORKSHOP OFFERINGS</div>
          <Topics topics={topics} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={1200} durationInFrames={360}>
        <AbsoluteFill>
          <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 30, color: '#f5a623', letterSpacing: 3 }}>CITIES ON THE TOUR</div>
          <Map cities={countries} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={1560} durationInFrames={240}><CTA /></Sequence>
    </AbsoluteFill>
  );
};
