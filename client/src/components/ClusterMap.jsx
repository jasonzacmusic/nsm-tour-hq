import React from 'react';
import { Link } from 'react-router-dom';

export default function ClusterMap({ clusters, byCluster }) {
  const rows = clusters
    .map(c => {
      const s = byCluster.find(x => x.cluster === c.name) || { total: 0, contacted: 0, replied: 0 };
      return { ...c, ...s };
    })
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...rows.map(r => r.total));
  const totalLeads = rows.reduce((a, r) => a + r.total, 0);

  return (
    <section className="card overflow-hidden">
      <header className="px-7 py-5 hairline-b flex items-end justify-between">
        <div>
          <div className="eyebrow eyebrow-gold">Section 02</div>
          <h2 className="font-display text-2xl text-paper mt-1.5">The Tour Map</h2>
          <p className="text-[11px] text-muted mt-1.5">{totalLeads} institutions, ranked by cluster. Contacted in gold, replied in green.</p>
        </div>
        <div className="flex items-center gap-5 text-[10px] text-muted uppercase tracking-widest">
          <Legend c="bg-line-bright" t="Total" />
          <Legend c="bg-gold" t="Contacted" />
          <Legend c="bg-sage" t="Replied" />
        </div>
      </header>

      <div className="px-7 py-5 space-y-3.5">
        {rows.map((r, i) => {
          const w = (r.total / max) * 100;
          const cPct = r.total ? (r.contacted / r.total) * 100 : 0;
          const rPct = r.total ? (r.replied / r.total) * 100 : 0;
          return (
            <Link to={`/leads?cluster=${encodeURIComponent(r.name)}`} key={r.name}
              className="group grid grid-cols-12 items-center gap-4 hover:opacity-100">
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <span className="font-mono text-[10px] tabular-nums text-muted-dim w-4">{String(i + 1).padStart(2, '0')}</span>
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                <div className="min-w-0">
                  <div className="font-display text-[15px] text-paper leading-none truncate group-hover:text-gold transition">{r.name}</div>
                  <div className="text-[10px] text-muted-dim mt-1 truncate">{r.cities || r.countries}</div>
                </div>
              </div>

              <div className="col-span-7">
                <div className="relative h-7 rounded bg-ink-900/60 overflow-hidden border border-line">
                  <div className="absolute inset-y-0 left-0 bg-line-bright/50 transition-all duration-500"
                    style={{ width: `${w}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-gold/35 transition-all duration-500"
                    style={{ width: `${(w * cPct) / 100}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-sage/70 transition-all duration-500"
                    style={{ width: `${(w * rPct) / 100}%` }} />
                  {r.total > 0 && (
                    <span className="absolute left-3 inset-y-0 flex items-center font-mono text-[11px] font-semibold text-paper">
                      {r.total}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-baseline justify-end gap-4 font-mono text-[11px] tabular-nums">
                <span className="text-gold">{r.contacted}<span className="text-muted-dim text-[9px] ml-1">C</span></span>
                <span className="text-sage">{r.replied}<span className="text-muted-dim text-[9px] ml-1">R</span></span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Legend({ c, t }) {
  return <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-sm ${c}`} />{t}</span>;
}
