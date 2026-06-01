import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, ArrowRight, Mail, TrendingUp } from 'lucide-react';
import { api } from '../lib/api.js';
import ClusterMap from '../components/ClusterMap.jsx';
import ClusterConstellation from '../components/ClusterConstellation.jsx';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [recent, setRecent] = useState([]);
  const [instantStatus, setInstantStatus] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, c, q, f, r, instant] = await Promise.all([
          api.export.stats(), api.clusters(),
          api.leads.list({ priority: 'Highest', status: 'not_contacted' }),
          api.comms.followups({ horizon_days: 1 }), api.emails.list(),
          api.emails.instantStatus().catch(e => ({ ok: false, error: e.message })),
        ]);
        setStats({ ...s, followups_due: f.filter(x => new Date(x.due_date) <= new Date()).length });
        setClusters(c);
        setPriorityQueue(q.slice(0, 6));
        setFollowups(f);
        setRecent(r.slice(0, 8));
        setInstantStatus(instant);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const overdue = followups.filter(f => new Date(f.due_date) <= new Date());
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const contactable = stats?.by_cluster?.reduce((a, c) => a + c.total, 0) || 0;
  const handwrite = stats?.handwrite || 0;

  const tiles = [
    { k: 'Total leads', v: stats?.total_leads, sub: `${clusters.length} clusters`, accent: 'gold' },
    { k: 'Instantly ready', v: stats?.instantly_ready, sub: 'has email + OK routing', accent: 'sage' },
    { k: 'Needs research', v: stats?.needs_verification, sub: `${stats?.missing_email ?? 0} missing email`, accent: 'paper' },
    { k: 'Hand-write', v: handwrite, sub: 'delicate contacts', accent: 'rust' },
  ];

  return (
    <div className="min-h-full pb-16">
      {/* ── HERO ───────────────────────────────────────────── */}
      <header className="relative px-12 pt-12 pb-10 overflow-hidden">
        <div className="grid grid-cols-12 gap-10 items-center">
          <div className="col-span-6 fade-up">
            <div className="flex items-center gap-3 mb-7">
              <span className="eyebrow eyebrow-gold">The Nathaniel Dispatch</span>
              <span className="h-px w-8 bg-line" />
              <span className="eyebrow font-mono">Vol. I · No. 01</span>
            </div>
            <h1 className="font-display text-[76px] leading-[0.92] tracking-tight text-paper">
              A musician's<br />
              outreach, <span className="italic text-gold">considered.</span>
            </h1>
            <p className="mt-7 max-w-md text-[14px] text-paper-dim leading-relaxed">
              Workshop-tour command for Jason Zachariah —
              <span className="text-paper"> {stats?.total_leads ?? '—'} institutions</span> across
              {' '}{clusters.length} clusters, each assessed for fit, language and tone.
              No mass mailers. Built around the schools that want him there.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link to="/leads?priority=Highest" className="btn-primary">
                Work the priority queue <ArrowRight size={14} />
              </Link>
              <Link to="/finder" className="btn-ghost">Find new schools</Link>
            </div>
          </div>

          <div className="col-span-6">
            <div className="card-feature p-6 fade-up" style={{ animationDelay: '.1s' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow eyebrow-gold">The Tour, Mapped</span>
                <span className="eyebrow">{contactable} live</span>
              </div>
              <div className="aspect-[100/62]">
                <ClusterConstellation clusters={clusters} byCluster={stats?.by_cluster || []} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {overdue.length > 0 && (
        <div className="mx-12 mb-8 border border-rust/60 bg-rust/10 px-5 py-3 rounded flex items-center gap-3">
          <AlertTriangle size={16} className="text-rust-hi" />
          <div className="flex-1 text-[13px] text-paper">
            <span className="font-semibold">{overdue.length} follow-up{overdue.length > 1 ? 's' : ''} overdue.</span>
            <span className="text-paper-dim ml-2">Time to nudge.</span>
          </div>
          <Link to="/email" className="eyebrow eyebrow-rust hover:text-rust-hi">Open studio →</Link>
        </div>
      )}

      {stats?.invalid_send_via > 0 && (
        <div className="mx-12 mb-8 border border-rust/60 bg-rust/10 px-5 py-3 rounded flex items-center gap-3">
          <AlertTriangle size={16} className="text-rust-hi" />
          <div className="flex-1 text-[13px] text-paper">
            <span className="font-semibold">{stats.invalid_send_via} lead{stats.invalid_send_via > 1 ? 's have' : ' has'} invalid send routing.</span>
            <span className="text-paper-dim ml-2">Fix before exporting to Instantly.</span>
          </div>
          <Link to="/leads" className="eyebrow eyebrow-rust hover:text-rust-hi">Open leads →</Link>
        </div>
      )}

      <section className="px-12 mb-8">
        <div className={`border px-5 py-3 rounded flex items-center gap-3 ${
          instantStatus?.configured ? 'border-sage/50 bg-sage/10' : 'border-gold/50 bg-gold/10'
        }`}>
          <Mail size={16} className={instantStatus?.configured ? 'text-sage' : 'text-gold'} />
          <div className="flex-1 text-[13px] text-paper">
            <span className="font-semibold">Send rail: Instantly</span>
            <span className="text-paper-dim ml-2">{instantStatus?.sender || 'workshops@jasonzacmusic.com'}</span>
          </div>
          <Link to="/settings" className="eyebrow hover:text-gold">Settings</Link>
        </div>
      </section>

      {/* ── STAT TILES ─────────────────────────────────────── */}
      <section className="px-12">
        <div className="press-divider mb-5"><span>The Numbers</span></div>
        <div className="grid grid-cols-4 gap-5">
          {tiles.map((t, i) => (
            <div key={t.k} className="card p-6 relative overflow-hidden fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                t.accent === 'gold' ? 'bg-gold' : t.accent === 'rust' ? 'bg-rust' : t.accent === 'sage' ? 'bg-sage' : 'bg-paper-dim'
              }`} />
              <div className="flex items-start justify-between">
                <span className="eyebrow">{t.k}</span>
                <span className="font-mono text-[10px] text-muted-dim">0{i + 1}</span>
              </div>
              <div className="bignum text-[58px] text-paper mt-4 tabular-nums">
                {t.v ?? <span className="text-muted-dim">—</span>}
              </div>
              <div className="text-[11px] text-muted mt-2">{t.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLUSTER CHART ──────────────────────────────────── */}
      <section className="px-12 mt-12">
        <ClusterMap clusters={clusters} byCluster={stats?.by_cluster || []} />
      </section>

      {/* ── QUEUE + WIRE ───────────────────────────────────── */}
      <section className="px-12 mt-12 grid grid-cols-12 gap-6">
        <article className="col-span-7 card">
          <header className="px-6 py-5 hairline-b flex items-end justify-between">
            <div>
              <div className="eyebrow eyebrow-rust">Section 03</div>
              <h2 className="font-display text-2xl text-paper mt-1.5">The Priority Queue</h2>
              <p className="text-[11px] text-muted mt-1.5">Uncontacted leads marked Highest. Send these first — many by hand.</p>
            </div>
            <Link to="/leads?priority=Highest" className="eyebrow hover:text-gold flex items-center gap-1">
              See all <ArrowUpRight size={11} />
            </Link>
          </header>
          <ol>
            {priorityQueue.length === 0 && (
              <li className="px-6 py-14 text-center text-muted text-[13px] italic">No uncontacted Highest-priority leads. Quiet day.</li>
            )}
            {priorityQueue.map((l, i) => (
              <li key={l.id} className="hairline-b last:border-0">
                <Link to={`/leads?id=${l.id}`} className="flex items-start gap-5 px-6 py-4 hover:bg-ink-800/50 transition group">
                  <span className="font-mono text-[12px] tabular-nums text-muted-dim pt-1.5 w-6 group-hover:text-gold transition">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[19px] text-paper leading-tight">{l.institution_name}</div>
                    <div className="text-[11px] text-muted mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-paper-dim">{l.city}{l.state ? `, ${l.state}` : ''}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-dim" />
                      <span>{l.cluster}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-dim" />
                      <span className="italic">{l.archetype.replace(/_/g, ' ')}</span>
                    </div>
                    {l.personalized_hook && (
                      <p className="text-[12px] text-paper-dim mt-2.5 leading-relaxed line-clamp-2 italic border-l-2 border-gold/30 pl-3">{l.personalized_hook}</p>
                    )}
                  </div>
                  <PriorityBadge value={l.priority} />
                </Link>
              </li>
            ))}
          </ol>
        </article>

        <div className="col-span-5 space-y-6">
          <article className="card">
            <header className="px-6 py-5 hairline-b">
              <div className="eyebrow eyebrow-gold">Section 04</div>
              <h2 className="font-display text-2xl text-paper mt-1.5">Wire Activity</h2>
            </header>
            <ul>
              {recent.length === 0 && (
                <li className="px-6 py-14 text-center text-muted text-[13px] italic">The wire is silent.<br />Nothing sent yet.</li>
              )}
              {recent.map(e => (
                <li key={e.id} className="px-6 py-3.5 flex items-start gap-3 hairline-b last:border-0">
                  <Mail size={13} className="text-muted-dim mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-paper truncate">{e.subject || <span className="text-muted italic">(no subject)</span>}</div>
                    <div className="text-[10px] text-muted mt-1 flex items-center gap-2">
                      <span className="truncate flex-1">{e.institution_name || '—'}</span>
                      <StatusBadge value={e.status} />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-dim font-mono tabular-nums pt-1">
                    {e.sent_at ? new Date(e.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-feature p-6">
            <div className="eyebrow eyebrow-gold mb-3">The Approach</div>
            <p className="font-display italic text-[20px] text-paper leading-snug">
              "No agenda. No fixed dates.<br />Just music."
            </p>
            <p className="text-[12px] text-paper-dim mt-4 leading-relaxed">
              Every email gauges interest first. Travel is built around the institutions
              that say yes — never the other way around.
            </p>
            <div className="hairline-t mt-5 pt-4 flex items-center justify-between">
              <span className="eyebrow">Jason Zachariah</span>
              <span className="text-[11px] text-muted font-mono">120K · 30+ countries</span>
            </div>
          </article>
        </div>
      </section>

      <footer className="px-12 mt-14">
        <div className="hairline-t pt-6 flex items-end justify-between text-[10px] text-muted-dim tracking-widest uppercase">
          <span>Nathaniel School of Music · Tour HQ</span>
          <span>{today} · Local build {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
