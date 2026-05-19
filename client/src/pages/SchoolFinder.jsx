import React, { useEffect, useState } from 'react';
import { Search, Plus, Loader2, AlertCircle, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { ARCHETYPES } from '../lib/constants.js';

export default function SchoolFinder() {
  const [clusters, setClusters] = useState([]);
  const [form, setForm] = useState({ cluster: '', city: '', country: 'India', institution_type: [], query: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [added, setAdded] = useState({});

  useEffect(() => { api.clusters().then(setClusters); }, []);

  const toggleType = (v) => setForm(f => ({
    ...f,
    institution_type: f.institution_type.includes(v) ? f.institution_type.filter(x => x !== v) : [...f.institution_type, v],
  }));

  const runSearch = async () => {
    setLoading(true); setError(null); setResults([]);
    try {
      const r = await api.finder.search({ ...form, institution_type: form.institution_type.join(', ') });
      setResults(r.results || []);
      setHistory(h => [{ form: { ...form }, count: r.results?.length || 0 }, ...h].slice(0, 8));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const addLead = async (idx) => {
    const r = results[idx];
    try {
      await api.leads.create({
        cluster: form.cluster || r.cluster || 'Northeast', city: r.city || form.city, country: form.country,
        institution_name: r.institution_name, archetype: r.archetype || 'contemporary_academy',
        contact_name: r.contact_name || null, contact_email: r.contact_email || null,
        instagram_handle: r.instagram_handle || null, linkedin_url: r.linkedin_url || null,
        whatsapp: r.whatsapp || null, website: r.website || null,
        recommended_topic: r.recommended_topic || null, priority: r.priority || 'Medium',
        personalized_hook: r.personalized_hook || null, send_via: r.send_via || 'INSTANTLY_OK',
        notes: [r.notes, r.sources?.length ? `Sources: ${r.sources.join(' | ')}` : null].filter(Boolean).join('\n'),
        language_confidence: r.confidence || 'high',
      });
      setAdded(a => ({ ...a, [idx]: true }));
    } catch (e) { alert('Add failed: ' + e.message); }
  };

  return (
    <div className="min-h-full">
      <header className="px-12 pt-10 pb-6 hairline-b">
        <div className="eyebrow eyebrow-gold">Section 04 · Research Desk</div>
        <h1 className="font-display text-[44px] leading-tight text-paper mt-1.5">School Finder <span className="italic text-gold">AI</span></h1>
        <p className="text-[13px] text-muted mt-2 max-w-xl">Claude researches verified-active institutions with personalised hooks pre-written. One click adds them to the roster.</p>
      </header>

      <div className="px-12 py-8 grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-5">
          <div className="card p-6 space-y-4">
            <Field label="Country">
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input" />
            </Field>
            <Field label="Cluster">
              <select value={form.cluster} onChange={e => setForm({ ...form, cluster: e.target.value })} className="input">
                <option value="">Any cluster</option>
                {clusters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" placeholder="e.g. Thrissur" />
            </Field>
            <Field label="Institution types">
              <div className="flex flex-wrap gap-1.5">
                {ARCHETYPES.map(a => (
                  <button key={a.value} onClick={() => toggleType(a.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-sm border transition ${
                      form.institution_type.includes(a.value)
                        ? 'bg-gold/15 border-gold text-gold'
                        : 'bg-ink-900/40 border-line text-muted hover:border-line-bright'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes for Claude">
              <textarea value={form.query} onChange={e => setForm({ ...form, query: e.target.value })} rows={3} className="input"
                placeholder="e.g. Catholic schools with active choirs" />
            </Field>
            <button onClick={runSearch} disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Researching…</> : <><Search size={14} /> Find schools</>}
            </button>
            {error && (
              <div className="border border-rust/50 bg-rust/10 text-[12px] text-paper p-3 rounded flex items-start gap-2">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-rust-hi" /><span>{error}</span>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="card-flat p-5">
              <div className="eyebrow mb-3">Recent searches</div>
              <div className="space-y-2 text-[12px]">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setForm(h.form)} className="block w-full text-left text-paper-dim hover:text-gold transition">
                    {h.form.city || 'any city'} · {h.form.cluster || 'any cluster'}
                    <span className="text-muted-dim font-mono ml-2">{h.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-4">
          {results.length === 0 && !loading && (
            <div className="card-flat text-center text-muted py-24">
              <Search size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-[13px] italic">Run a search to see researched institutions here.</p>
            </div>
          )}
          {results.map((r, i) => (
            <div key={i} className="card p-5 fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[20px] text-paper leading-tight">{r.institution_name}</div>
                  <div className="text-[11px] text-muted mt-1.5">{r.city} · <span className="uppercase tracking-wider">{r.archetype}</span></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.confidence !== 'high' && <span className="text-[9px] px-2 py-0.5 rounded-sm bg-gold/15 border border-gold/50 text-gold font-bold uppercase tracking-widest">Verify</span>}
                  {added[i]
                    ? <span className="text-[12px] text-sage flex items-center gap-1"><Check size={13} /> Added</span>
                    : <button onClick={() => addLead(i)} className="btn-ghost"><Plus size={12} /> Add to roster</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-paper-dim mt-4">
                <Meta k="Contact" v={r.contact_name} />
                <Meta k="Email" v={r.contact_email} />
                <Meta k="Instagram" v={r.instagram_handle} />
                <Meta k="LinkedIn" v={r.linkedin_url} />
                <Meta k="WhatsApp" v={r.whatsapp} />
                <Meta k="Topic" v={r.recommended_topic} />
              </div>
              {r.personalized_hook && (
                <p className="text-[13px] text-paper mt-4 italic leading-relaxed border-l-2 border-gold/30 pl-3">{r.personalized_hook}</p>
              )}
              {r.notes && <p className="text-[11px] text-muted mt-2">{r.notes}</p>}
              {r.sources?.length > 0 && (
                <div className="text-[11px] text-muted mt-3 flex gap-2 flex-wrap">
                  {r.sources.map((s, idx) => <a key={`${s}-${idx}`} href={s} target="_blank" rel="noreferrer" className="text-gold underline decoration-dotted">Source {idx + 1}</a>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="eyebrow block mb-1.5">{label}</label>{children}</div>;
}
function Meta({ k, v }) {
  return <div><span className="text-muted-dim">{k}: </span><span>{v || '—'}</span></div>;
}
