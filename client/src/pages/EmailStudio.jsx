import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Check, AlertTriangle, Search as SearchIcon } from 'lucide-react';
import { api } from '../lib/api.js';
import { EMAIL_TEMPLATES, getTemplate, substituteVars } from '../lib/templates.js';
import EmailPreview from '../components/EmailPreview.jsx';
import { PriorityBadge, SendViaBadge } from '../components/StatusBadge.jsx';
import { ARCHETYPES } from '../lib/constants.js';

export default function EmailStudio() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState('single');
  const [templateId, setTemplateId] = useState('conservatory');
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subjects[0]);
  const [body, setBody] = useState(EMAIL_TEMPLATES[0].body);
  const [preview, setPreview] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadResults, setLeadResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [checks, setChecks] = useState({ hook: false, subject: false, attach: true, brochure: true, from: true });
  const [sending, setSending] = useState(false);
  const [sentLog, setSentLog] = useState(null);

  // bulk state
  const [bulkCluster, setBulkCluster] = useState('');
  const [bulkArchetype, setBulkArchetype] = useState('');
  const [bulkLeads, setBulkLeads] = useState([]);
  const [bulkPreview, setBulkPreview] = useState(null);

  useEffect(() => {
    const t = getTemplate(templateId);
    setSubject(t.subjects[subjectIdx] || t.subjects[0]);
    setBody(t.body);
  }, [templateId, subjectIdx]);

  useEffect(() => {
    const leadId = params.get('lead');
    if (leadId) api.leads.get(leadId).then(setSelectedLead).catch(() => {});
  }, [params]);

  useEffect(() => {
    if (leadSearch.length < 2) { setLeadResults([]); return; }
    const t = setTimeout(() => {
      api.leads.list({ search: leadSearch }).then(r => setLeadResults(r.slice(0, 8)));
    }, 200);
    return () => clearTimeout(t);
  }, [leadSearch]);

  useEffect(() => {
    if (bulkCluster || bulkArchetype) {
      api.leads.list({ cluster: bulkCluster, archetype: bulkArchetype, send_via: 'INSTANTLY_OK' }).then(setBulkLeads);
    } else {
      setBulkLeads([]);
    }
  }, [bulkCluster, bulkArchetype]);

  const subjectChars = useMemo(() => (selectedLead ? substituteVars(subject, selectedLead) : subject).length, [subject, selectedLead]);
  const wordCount = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);

  const send = async () => {
    if (!selectedLead) return alert('Select a lead first');
    if (!Object.values(checks).every(Boolean)) return alert('Complete the pre-send checklist');
    setSending(true);
    try {
      const r = await api.emails.send({ lead_id: selectedLead.id, subject, body });
      setSentLog(r);
      const refreshed = await api.leads.get(selectedLead.id);
      setSelectedLead(refreshed);
    } catch (e) { alert('Send failed: ' + e.message); }
    setSending(false);
  };

  const bulkDryRun = async () => {
    if (bulkLeads.length === 0) return;
    const r = await api.emails.sendBulk({ lead_ids: bulkLeads.map(l => l.id), subject, body, dry_run: true });
    setBulkPreview(r);
  };
  const bulkSend = async () => {
    if (!confirm(`Send to ${bulkLeads.length} leads at ~20/hr?`)) return;
    setSending(true);
    try {
      const r = await api.emails.sendBulk({ lead_ids: bulkLeads.map(l => l.id), subject, body });
      alert(`Bulk send done — sent: ${r.sent}, failed: ${r.failed}, skipped: ${r.skipped}`);
    } catch (e) { alert('Bulk send failed: ' + e.message); }
    setSending(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="hairline-b px-8 pt-7 pb-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow eyebrow-gold">Section 03</div>
            <h1 className="font-display text-4xl text-paper mt-1">Email Studio</h1>
            <div className="text-[11px] text-muted italic mt-1">Six archetype templates · variable substitution · 20-per-hour rate limit on bulk send</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTab('single')} className={`px-4 py-2.5 text-[12px] uppercase tracking-widest font-semibold border-b-2 -mb-px transition ${tab === 'single' ? 'border-rust text-paper' : 'border-transparent text-muted hover:text-paper'}`}>Single send</button>
          <button onClick={() => setTab('bulk')} className={`px-4 py-2.5 text-[12px] uppercase tracking-widest font-semibold border-b-2 -mb-px transition ${tab === 'bulk' ? 'border-rust text-paper' : 'border-transparent text-muted hover:text-paper'}`}>Bulk send</button>
        </div>
      </div>

      {tab === 'single' ? (
        <div className="flex-1 grid grid-cols-12 min-h-0">
          <aside className="col-span-3 border-r border-card overflow-y-auto scrollbar-thin p-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Templates</h3>
            <div className="space-y-2">
              {EMAIL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTemplateId(t.id); setSubjectIdx(0); }}
                  className={`w-full text-left p-3 rounded border ${templateId === t.id ? 'border-accent bg-card/40' : 'border-card bg-surface hover:border-accent/40'}`}
                >
                  <div className="text-sm font-medium text-white">{t.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{t.sendVia === 'DO_NOT_USE_INSTANTLY' ? '🚫 Hand-write only' : 'OK for Instantly'}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="col-span-6 border-r border-card flex flex-col min-h-0">
            <div className="p-3 border-b border-card flex items-center gap-3">
              <select value={subjectIdx} onChange={e => setSubjectIdx(+e.target.value)} className="bg-card/40 border border-card rounded px-2 py-1.5 text-xs text-white">
                {getTemplate(templateId).subjects.map((s, i) => <option key={i} value={i}>Subject variant {i + 1}</option>)}
              </select>
              <button onClick={() => setPreview(!preview)} className="ml-auto text-xs px-2.5 py-1.5 bg-card hover:bg-card/70 rounded">
                {preview ? 'Edit' : 'Preview rendered'}
              </button>
            </div>
            <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">
              {preview ? (
                <EmailPreview subject={subject} body={body} lead={selectedLead || { contact_name: 'Sample Person', institution_name: '{{company_name}}' }} mode="rendered" />
              ) : (
                <>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-card/40 border border-card rounded px-3 py-2 text-sm text-white mb-2" placeholder="Subject line…" />
                  <div className="text-[11px] text-slate-400 mb-3">{subjectChars} chars · keep under 60</div>
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={22} className="w-full bg-card/40 border border-card rounded px-3 py-2 text-sm text-white font-mono leading-relaxed" />
                  <div className="text-[11px] text-slate-400 mt-2">{wordCount} words · {body.length} chars</div>
                  <div className="mt-3">
                    <EmailPreview subject={subject} body={body} mode="compose" />
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="col-span-3 overflow-y-auto scrollbar-thin p-3 space-y-3">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Recipient</h3>
              <div className="relative">
                <SearchIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search leads…" className="w-full bg-card/40 border border-card rounded pl-7 pr-3 py-1.5 text-sm" />
              </div>
              {leadResults.length > 0 && (
                <div className="mt-2 bg-card rounded border border-card max-h-44 overflow-y-auto">
                  {leadResults.map(l => (
                    <button key={l.id} onClick={() => { setSelectedLead(l); setLeadSearch(''); setLeadResults([]); }}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-surface">
                      <div className="text-white truncate">{l.institution_name}</div>
                      <div className="text-slate-400">{l.city} · {l.cluster}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedLead && (
              <div className="bg-surface border border-card rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-white">{selectedLead.institution_name}</div>
                <div className="text-slate-300">{selectedLead.contact_name || '—'}</div>
                <div className="text-slate-400">{selectedLead.contact_email || 'No email'}</div>
                <div className="flex items-center gap-2 pt-1">
                  <PriorityBadge value={selectedLead.priority} />
                  <SendViaBadge value={selectedLead.send_via} />
                </div>
                {selectedLead.send_via === 'DO_NOT_USE_INSTANTLY' && (
                  <div className="bg-accent/20 border border-accent rounded p-2 mt-2 text-[11px] flex items-start gap-2">
                    <AlertTriangle size={12} className="text-accent shrink-0 mt-0.5" />
                    <span>This is hand-write only. Send carefully, one at a time.</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Pre-send checklist</h3>
              {[
                { k: 'hook', label: 'Personalised hook is specific' },
                { k: 'subject', label: 'Subject under 60 chars' },
                { k: 'attach', label: 'No attachments' },
                { k: 'brochure', label: 'Brochure link present' },
                { k: 'from', label: 'Sending from correct address' },
              ].map(({ k, label }) => (
                <label key={k} className="flex items-center gap-2 text-xs text-slate-300 py-1 cursor-pointer">
                  <input type="checkbox" checked={checks[k]} onChange={e => setChecks({ ...checks, [k]: e.target.checked })} />
                  <span className={checks[k] ? 'text-slate-200' : 'text-slate-400'}>{label}</span>
                </label>
              ))}
            </div>

            <button onClick={send} disabled={!selectedLead || sending} className="w-full bg-accent hover:bg-accent/80 disabled:opacity-40 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium">
              <Send size={14} /> {sending ? 'Sending…' : 'Send now'}
            </button>

            {sentLog && (
              <div className="bg-success/20 border border-success rounded p-2 text-xs flex items-start gap-2">
                <Check size={12} className="text-success shrink-0 mt-0.5" />
                <div>
                  <div className="text-white">Sent. Follow-up queued for +4 days.</div>
                  <div className="text-slate-400 text-[10px]">log #{sentLog.log_id}</div>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 min-h-0">
          <aside className="col-span-4 border-r border-card p-4 overflow-y-auto scrollbar-thin space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Filter</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Cluster</label>
              <ClusterSelect value={bulkCluster} onChange={setBulkCluster} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Archetype</label>
              <select value={bulkArchetype} onChange={e => setBulkArchetype(e.target.value)} className="w-full bg-card/40 border border-card rounded px-2 py-1.5 text-sm">
                <option value="">Any</option>
                {ARCHETYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="bg-surface border border-card rounded p-3 text-sm">
              <div className="text-slate-300">{bulkLeads.length} eligible leads (Instantly OK + has email)</div>
              <div className="text-[11px] text-slate-400 mt-1">Rate limit: 20/hour · ~{Math.ceil(bulkLeads.length / 20)} hr to complete</div>
            </div>
            <div className="space-y-2">
              <button onClick={bulkDryRun} disabled={bulkLeads.length === 0} className="w-full py-2 bg-card hover:bg-card/70 rounded text-sm disabled:opacity-40">Dry run preview</button>
              <button onClick={bulkSend} disabled={bulkLeads.length === 0 || sending} className="w-full py-2 bg-accent hover:bg-accent/80 rounded text-sm text-white font-medium disabled:opacity-40">{sending ? 'Sending…' : `Send to ${bulkLeads.length}`}</button>
            </div>
          </aside>
          <section className="col-span-8 p-4 overflow-y-auto scrollbar-thin">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Composer (using template: {getTemplate(templateId).label})</h3>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-card/40 border border-card rounded px-3 py-2 text-sm text-white mb-2" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={18} className="w-full bg-card/40 border border-card rounded px-3 py-2 text-sm text-white font-mono" />
            {bulkPreview && (
              <div className="mt-3 bg-surface border border-card rounded p-3 text-xs">
                <div className="text-white font-semibold mb-1">Dry run: {bulkPreview.eligible} eligible · {bulkPreview.skipped} skipped</div>
                {bulkPreview.previews?.map((p, i) => (
                  <div key={i} className="mt-2 pt-2 border-t border-card">
                    <div className="text-slate-300">{p.to}</div>
                    <div className="text-white font-medium">{p.subject}</div>
                    <div className="text-slate-400 text-[11px]">{p.body_preview}…</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ClusterSelect({ value, onChange }) {
  const [clusters, setClusters] = useState([]);
  useEffect(() => { api.clusters().then(setClusters); }, []);
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-card/40 border border-card rounded px-2 py-1.5 text-sm">
      <option value="">Any</option>
      {clusters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
    </select>
  );
}
