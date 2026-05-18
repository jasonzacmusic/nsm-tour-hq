import React, { useMemo } from 'react';

// Approximate, art-directed positions (viewBox 0..100 x, 0..62 y)
const POS = {
  'Dubai/UAE':            { x: 9,  y: 30 },
  'Mussoorie+Dehradun':   { x: 40, y: 13 },
  'Northeast':            { x: 66, y: 19 },
  'Goa+Mangalore':        { x: 30, y: 40 },
  'Kerala':               { x: 33, y: 52 },
  'South India':          { x: 42, y: 47 },
  'Thailand':             { x: 74, y: 38 },
  'Vietnam':              { x: 84, y: 31 },
  'Singapore':            { x: 80, y: 52 },
  'South Africa':         { x: 20, y: 58 },
  'Zimbabwe+Namibia':     { x: 14, y: 50 },
};

// Route order — the imagined tour path
const ROUTE = [
  'Mussoorie+Dehradun', 'Northeast', 'South India', 'Kerala',
  'Goa+Mangalore', 'Dubai/UAE', 'Vietnam', 'Thailand', 'Singapore',
  'South Africa', 'Zimbabwe+Namibia',
];

export default function ClusterConstellation({ clusters, byCluster }) {
  const data = useMemo(() => {
    const map = {};
    for (const c of clusters) {
      const s = byCluster.find(x => x.cluster === c.name) || { total: 0, contacted: 0 };
      map[c.name] = { ...c, total: s.total, contacted: s.contacted };
    }
    return map;
  }, [clusters, byCluster]);

  const maxTotal = Math.max(1, ...Object.values(data).map(d => d.total));
  const routePts = ROUTE.filter(n => POS[n]).map(n => POS[n]);
  const pathD = routePts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 100 62" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="node" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2C162" />
          <stop offset="100%" stopColor="#E0A94A" />
        </radialGradient>
        <radialGradient id="nodeActive" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8714F" />
          <stop offset="100%" stopColor="#D15A43" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* faint lat/long grid */}
      <g stroke="#282B38" strokeWidth="0.15">
        {[12, 24, 36, 48].map(y => <line key={y} x1="2" y1={y} x2="98" y2={y} />)}
        {[20, 40, 60, 80].map(x => <line key={x} x1={x} y1="4" x2={x} y2="58" />)}
      </g>

      {/* route path */}
      <path d={pathD} fill="none" stroke="#3A3E4F" strokeWidth="0.35"
        strokeDasharray="1.4 1.4" strokeLinecap="round" />

      {/* nodes */}
      {Object.values(data).map((d) => {
        const p = POS[d.name];
        if (!p) return null;
        const r = 1.4 + (d.total / maxTotal) * 3.4;
        const hot = d.total > 0;
        return (
          <g key={d.name}>
            <circle cx={p.x} cy={p.y} r={r + 1.6} fill={hot ? 'rgba(224,169,74,0.10)' : 'transparent'} filter="url(#soft)" />
            <circle cx={p.x} cy={p.y} r={r} fill={hot ? 'url(#node)' : '#2C2E3A'}
              stroke={hot ? '#F2C162' : '#3A3E4F'} strokeWidth="0.25" />
            <text x={p.x} y={p.y - r - 1.4} textAnchor="middle"
              fontSize="2.1" fontWeight="600" letterSpacing="0.04"
              fill={hot ? '#F4EFE6' : '#5A5F72'} fontFamily="Inter, sans-serif">
              {d.name.replace('+', ' + ').toUpperCase()}
            </text>
            {hot && (
              <text x={p.x} y={p.y + 0.8} textAnchor="middle" fontSize="2.4"
                fontWeight="700" fill="#1B1D27" fontFamily="Inter, sans-serif">
                {d.total}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
