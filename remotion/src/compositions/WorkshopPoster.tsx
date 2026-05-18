import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

type Props = { institutionName: string; city: string; topics: string[] };

export const WorkshopPoster: React.FC<Props> = ({ institutionName, city, topics }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', opacity: fade }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(135deg, #0f3460, #e94560)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 56, fontFamily: 'Inter, sans-serif', color: '#f5a623', letterSpacing: 6, fontSize: 26 }}>WORKSHOP</div>
      </div>

      <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, padding: '0 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 70, color: '#fff', lineHeight: 1.1 }}>{institutionName}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, color: '#94a3b8', marginTop: 8, letterSpacing: 2 }}>{city.toUpperCase()}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 36, textAlign: 'left' }}>
          {topics.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 22, color: '#fff' }}>
              <span style={{ width: 8, height: 8, background: '#f5a623', borderRadius: '50%' }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 56px', background: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>Jason Zachariah</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#f5a623' }}>Nathaniel School of Music</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#fff' }}>
          <div>music@nathanielschool.com</div>
          <div>+91 98454 65411</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
