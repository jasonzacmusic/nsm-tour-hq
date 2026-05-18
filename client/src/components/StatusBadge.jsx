import React from 'react';

const PRIORITY_STYLES = {
  Highest: 'text-rust border-rust/50 bg-rust/10',
  High:    'text-gold border-gold/50 bg-gold/10',
  Medium:  'text-paper-dim border-hair-2 bg-ink-800',
  Low:     'text-muted border-hair bg-ink-800/50',
};
const STATUS_STYLES = {
  not_contacted:   'text-muted border-hair',
  contacted:       'text-gold border-gold/40 bg-gold/5',
  replied:         'text-sage border-sage/50 bg-sage/10',
  follow_up_sent:  'text-paper-dim border-hair-2',
  closed:          'text-muted-dim border-hair',
};

export function PriorityBadge({ value }) {
  if (!value) return null;
  const cls = PRIORITY_STYLES[value] || PRIORITY_STYLES.Medium;
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 uppercase tracking-widest border ${cls}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  if (!value) return null;
  const label = String(value).replace(/_/g, ' ');
  const cls = STATUS_STYLES[value] || STATUS_STYLES.not_contacted;
  return <span className={`text-[9px] font-medium px-1.5 py-0.5 uppercase tracking-widest border ${cls}`}>{label}</span>;
}

export function SendViaBadge({ value }) {
  if (value === 'DO_NOT_USE_INSTANTLY') {
    return <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest border border-rust text-rust bg-rust/10">Hand-write</span>;
  }
  return <span className="text-[9px] font-medium px-1.5 py-0.5 uppercase tracking-widest border border-hair-2 text-paper-mute">Instantly OK</span>;
}
