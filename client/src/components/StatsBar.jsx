import React from 'react';

export default function StatsBar({ stats }) {
  const items = [
    { label: 'Total leads', value: stats?.total_leads, sub: 'institutions in the database' },
    { label: 'Emails sent', value: stats?.emails_sent, sub: 'across all campaigns' },
    { label: 'Reply rate', value: stats !== null && stats !== undefined ? `${stats?.reply_rate ?? 0}%` : null, sub: 'of contacted leads' },
    { label: 'Follow-ups due', value: stats?.followups_due ?? 0, sub: 'within 24 hours' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-hair editorial-card overflow-hidden">
      {items.map((s, i) => (
        <div key={s.label} className="bg-ink-900 px-6 py-7 relative">
          <div className="eyebrow">{s.label}</div>
          <div className="bignum text-[64px] text-paper mt-3 tabular-nums">
            {s.value ?? <span className="text-muted-dim">—</span>}
          </div>
          <div className="text-[11px] text-muted mt-2 italic font-light">{s.sub}</div>
          <div className="absolute top-5 right-5 font-mono text-[10px] text-muted-dim tabular-nums">0{i + 1}</div>
        </div>
      ))}
    </div>
  );
}
