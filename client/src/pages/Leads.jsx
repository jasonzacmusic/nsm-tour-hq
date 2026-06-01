import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Upload, Download, X, Pencil, Trash2, Mail, ChevronDown, ChevronUp, Sparkles, Copy, MessageCircle, Instagram, ExternalLink, FileText, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { ARCHETYPES, PRIORITIES, STATUSES, SEND_VIA, LANG_CONFIDENCE, VERIFICATION_LEVELS, ENTITY_TYPES, WORKSHOP_TOPICS } from '../lib/constants.js';
import { PriorityBadge, StatusBadge, SendViaBadge } from '../components/StatusBadge.jsx';

const EMPTY_FILTERS = {
  cluster: '', city: '', country: '', archetype: '', entity_type: '', priority: '', status: '', send_via: '', language_confidence: '', verification_level: '', search: '',
};

function filtersFromParams(sp) {
  const f = { ...EMPTY_FILTERS };
  for (const k of Object.keys(EMPTY_FILTERS)) {
    const v = sp.get(k);
    if (v) f[k] = v;
  }
  return f;
}

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    const id = searchParams.get('id');
    return id ? Number(id) : null;
  });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.leads.list(filters);
      setLeads(data);
    } finally { setLoading(false); }
  };

  // Wrap setFilters so UI changes also update the URL (shareable + back/forward).
  const updateFilters = (next) => {
    setFilters(next);
    const sp = {};
    for (const [k, v] of Object.entries(next)) if (v) sp[k] = v;
    setSearchParams(sp, { replace: true });
  };

  useEffect(() => { api.clusters().then(setClusters); }, []);

  // Sync URL params -> filters/expanded when navigating here from elsewhere
  // (Dashboard cluster links, priority queue, hero CTA).
  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
    const id = searchParams.get('id');
    setExpanded(id ? Number(id) : null);
    // eslint-disable-next-line
  }, [searchParams.toString()]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [JSON.stringify(filters)]);

  // Scroll an auto-opened lead (from Dashboard) into view.
  useEffect(() => {
    if (expanded && leads.length) {
      const el = document.getElementById(`lead-${expanded}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line
  }, [expanded, leads.length]);

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await api.leads.importCsv(file);
      alert(`Import: added ${r.added}, updated ${r.updated}, skipped ${r.skipped} (of ${r.total}).`);
      load();
    } catch (err) { alert('Import error: ' + err.message); }
    e.target.value = '';
  };

  const onExport = () => {
    const url = api.export.csvUrl({ cluster: filters.cluster, send_via: filters.send_via });
    window.open(url, '_blank');
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.leads.remove(id);
    load();
  };

  const onCompose = (lead) => navigate(`/email?lead=${lead.id}`);

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 hairline border-r bg-ink-800/40 overflow-y-auto scrollbar-thin">
        <div className="px-5 pt-6 pb-3">
          <div className="eyebrow eyebrow-gold">Section 02</div>
          <h2 className="font-display text-xl text-paper mt-1">Filters</h2>
        </div>
        <div className="px-5 space-y-3 pb-6 hairline-t pt-4">
          <FilterSelect label="Cluster" value={filters.cluster} onChange={v => updateFilters({ ...filters, cluster: v })} options={clusters.map(c => ({ value: c.name, label: c.name }))} />
          <FilterInput label="City" value={filters.city} onChange={v => updateFilters({ ...filters, city: v })} />
          <FilterInput label="Country" value={filters.country} onChange={v => updateFilters({ ...filters, country: v })} />
          <FilterSelect label="Entity type" value={filters.entity_type} onChange={v => updateFilters({ ...filters, entity_type: v })} options={ENTITY_TYPES} />
          <FilterSelect label="Archetype" value={filters.archetype} onChange={v => updateFilters({ ...filters, archetype: v })} options={ARCHETYPES} />
          <FilterSelect label="Priority" value={filters.priority} onChange={v => updateFilters({ ...filters, priority: v })} options={PRIORITIES.map(p => ({ value: p, label: p }))} />
          <FilterSelect label="Verification" value={filters.verification_level} onChange={v => updateFilters({ ...filters, verification_level: v })} options={VERIFICATION_LEVELS.map(v => ({ value: v, label: v }))} />
          <FilterSelect label="Status" value={filters.status} onChange={v => updateFilters({ ...filters, status: v })} options={STATUSES} />
          <FilterSelect label="Send via" value={filters.send_via} onChange={v => updateFilters({ ...filters, send_via: v })} options={SEND_VIA} />
          <FilterSelect label="Language conf." value={filters.language_confidence} onChange={v => updateFilters({ ...filters, language_confidence: v })} options={LANG_CONFIDENCE.map(l => ({ value: l, label: l }))} />
          <button
            onClick={() => updateFilters({ ...EMPTY_FILTERS })}
            className="eyebrow hover:text-rust transition pt-1"
          >Clear all filters</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-8 pt-7 pb-5 hairline-b">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="eyebrow eyebrow-gold">The Roster</div>
              <h1 className="font-display text-4xl text-paper mt-1">All institutions <span className="italic text-paper-dim font-medium">— {loading ? '…' : leads.length}</span></h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="btn-ghost"><Upload size={13} />Import</button>
              <input ref={fileRef} type="file" accept=".csv" hidden onChange={onImport} />
              <button onClick={onExport} className="btn-ghost"><Download size={13} />Export</button>
              <button onClick={() => setEditing({})} className="btn-primary"><Plus size={13} />New lead</button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dim" />
            <input
              value={filters.search}
              onChange={e => updateFilters({ ...filters, search: e.target.value })}
              placeholder="Search institution, city, contact, notes…"
              className="input pl-9"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-800/60 sticky top-0 z-10 hairline-b">
              <tr className="text-muted">
                <th className="text-left px-8 py-3 font-medium tracking-widest uppercase text-[10px]">Institution</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Contact</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Cluster</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Type</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Pri.</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Status</th>
                <th className="text-left px-3 py-3 font-medium tracking-widest uppercase text-[10px]">Send</th>
                <th className="text-right px-8 py-3 font-medium tracking-widest uppercase text-[10px]">—</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <React.Fragment key={l.id}>
                  <tr id={`lead-${l.id}`} className={`hairline-b hover:bg-ink-800/30 transition-colors ${expanded === l.id ? 'bg-ink-800/40' : ''}`}>
                    <td className="px-8 py-3">
                      <div className="font-display text-[15px] text-paper leading-tight">{l.institution_name}</div>
                      <div className="text-[11px] text-muted mt-0.5">{l.city}{l.state ? `, ${l.state}` : ''}{l.country && l.country !== 'India' ? ` · ${l.country}` : ''}</div>
                    </td>
                    <td className="px-3 py-3 text-[11px]">
                      {l.contact_name && <div className="text-paper-dim">{l.contact_name}</div>}
                      <div className="text-muted truncate max-w-[200px]">{l.contact_email || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-paper-dim">{l.cluster}</td>
                    <td className="px-3 py-3 text-[11px] text-muted italic">{(l.entity_type || l.archetype).replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3"><PriorityBadge value={l.priority} /></td>
                    <td className="px-3 py-3"><StatusBadge value={l.status} /></td>
                    <td className="px-3 py-3"><SendViaBadge value={l.send_via} /></td>
                    <td className="px-8 py-3 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <IconBtn title="View" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                          {expanded === l.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => setEditing(l)}><Pencil size={13} /></IconBtn>
                        <IconBtn title="Compose" onClick={() => onCompose(l)}><Mail size={13} /></IconBtn>
                        <IconBtn title="Delete" onClick={() => onDelete(l.id)}><Trash2 size={13} /></IconBtn>
                      </div>
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr className="bg-ink-800/30">
                      <td colSpan={8} className="px-8 py-5 hairline-b">
                        <LeadDetail lead={l} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {leads.length === 0 && !loading && (
                <tr><td colSpan={8} className="text-center py-16 text-muted italic">No leads match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <LeadFormDrawer lead={editing} clusters={clusters} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="eyebrow block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input text-[12px]">
        <option value="">All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FilterInput({ label, value, onChange }) {
  return (
    <div>
      <label className="eyebrow block mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="input text-[12px]" />
    </div>
  );
}

function IconBtn({ children, ...props }) {
  return <button {...props} className="p-1.5 hover:bg-ink-700 hover:text-gold rounded-sm text-muted transition">{children}</button>;
}

function LeadDetail({ lead }) {
  const [full, setFull] = useState(null);
  useEffect(() => { api.leads.get(lead.id).then(setFull); }, [lead.id]);
  if (!full) return <div className="text-[11px] text-muted italic">Loading…</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[12px]">
      <div className="space-y-1.5">
        <DetailRow k="Recommended topic" v={full.recommended_topic} />
        <DetailRow k="Entity type" v={full.entity_type} />
        <DetailRow k="Subtype" v={full.subtype} />
        <DetailRow k="Verification" v={full.verification_level} />
        <DetailRow k="Format" v={full.format_recommendation} />
        <DetailRow k="Website" v={full.website && <a href={full.website} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-hi underline decoration-dotted">{full.website}</a>} />
        <DetailRow k="Instagram" v={full.instagram_handle} />
        <DetailRow k="LinkedIn" v={full.linkedin_url && <a href={full.linkedin_url} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-hi underline decoration-dotted">{full.linkedin_url}</a>} />
        <DetailRow k="WhatsApp" v={full.whatsapp} />
        <DetailRow k="Phone" v={full.phone} />
        <DetailRow k="Source" v={full.source_url && <a href={full.source_url.split('|')[0]?.trim()} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-hi underline decoration-dotted">{full.source_url}</a>} />
        <DetailRow k="Source type" v={full.source_type} />
        <DetailRow k="Outreach angle" v={full.recommended_outreach_angle} />
        <DetailRow k="Dedupe key" v={full.dedupe_key} />
        <DetailRow k="Notes" v={full.notes} />
      </div>
      <div>
        <OutreachActions lead={full} />
        <div className="eyebrow eyebrow-gold mb-2">The Hook</div>
        <p className="font-display italic text-[15px] text-paper leading-relaxed mb-5 pl-3 border-l-2 border-gold/40">
          {full.personalized_hook || <span className="text-muted not-italic">— not yet written —</span>}
        </p>
        <CommunicationHistory communications={full.communications || []} emails={full.emails || []} />
      </div>
    </div>
  );
}

const DEFAULT_BROCHURE_URL = 'https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0';
const DEFAULT_WHATSAPP = '+91 98454 65411';
const DEFAULT_YOUTUBE = 'https://youtube.com/nathanielschool';
const PERSONAL_EMAIL_SENDER = 'workshops@jasonzacmusic.com';

function OutreachActions({ lead }) {
  const [settings, setSettings] = useState({});
  const [copied, setCopied] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [logged, setLogged] = useState(null);

  useEffect(() => { api.settings.get().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { setDrafts(buildDrafts(lead, settings)); }, [lead, settings]);
  if (!drafts) return null;

  const copy = async (key, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1300);
  };
  const openEmail = () => {
    if (!lead.contact_email) return;
    window.open(buildGmailComposeUrl({
      to: lead.contact_email,
      subject: drafts.emailSubject,
      body: drafts.emailBody,
      from: PERSONAL_EMAIL_SENDER,
    }), '_blank');
  };
  const openWhatsapp = () => {
    const phone = normalizePhoneForWa(lead.whatsapp || lead.phone);
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(drafts.whatsapp)}`, '_blank');
  };
  const openInstagram = () => {
    const handle = normalizeInstagram(lead.instagram_handle);
    if (!handle) return;
    window.open(`https://www.instagram.com/${handle}/`, '_blank');
  };
  const logCommunication = async (channel, payload = {}) => {
    const row = await api.comms.create({
      lead_id: lead.id,
      channel,
      status: 'sent',
      subject: payload.subject || null,
      message_preview: payload.message || '',
      contact_value: payload.contact || '',
      asset_url: drafts.brochureUrl,
      notes: payload.notes || '',
    });
    setLogged(channel);
    setTimeout(() => setLogged(null), 1500);
    return row;
  };
  const search = (kind) => {
    const place = [lead.city, lead.country].filter(Boolean).join(' ');
    const base = `${lead.institution_name} ${place}`.trim();
    const q = kind === 'contact'
      ? `${base} contact email`
      : kind === 'instagram'
        ? `site:instagram.com ${base}`
        : base;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
  };

  return (
    <div className="card-flat p-4 mb-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow eyebrow-gold">Outreach Composer</div>
          <div className="text-[11px] text-muted mt-1">Entity-aware drafts with brochure link included. Email opens from {PERSONAL_EMAIL_SENDER}.</div>
        </div>
        <button onClick={() => window.open(drafts.brochureUrl, '_blank')} className="btn-ghost"><FileText size={12} />Brochure</button>
      </div>

      <DraftBox
        label="Email"
        value={`${drafts.emailSubject}\n\n${drafts.emailBody}`}
        onChange={v => {
          const [subject, ...body] = v.split('\n');
          setDrafts({ ...drafts, emailSubject: subject, emailBody: body.join('\n').trimStart() });
        }}
        actions={[
          { label: copied === 'email' ? 'Copied' : 'Copy', icon: Copy, onClick: () => copy('email', `Subject: ${drafts.emailSubject}\n\n${drafts.emailBody}`) },
          { label: lead.contact_email ? 'Open Gmail' : 'No Email', icon: Mail, onClick: openEmail, disabled: !lead.contact_email },
          { label: logged === 'email' ? 'Logged' : 'Log sent', icon: Check, onClick: () => logCommunication('email', { subject: drafts.emailSubject, message: drafts.emailBody, contact: lead.contact_email, notes: `Manual Gmail outreach from ${PERSONAL_EMAIL_SENDER}` }) },
        ]}
      />

      <DraftBox
        label="WhatsApp"
        value={drafts.whatsapp}
        onChange={v => setDrafts({ ...drafts, whatsapp: v })}
        actions={[
          { label: copied === 'wa' ? 'Copied' : 'Copy', icon: Copy, onClick: () => copy('wa', drafts.whatsapp) },
          { label: lead.whatsapp || lead.phone ? 'Open WhatsApp' : 'No Number', icon: MessageCircle, onClick: openWhatsapp, disabled: !(lead.whatsapp || lead.phone) },
          { label: logged === 'whatsapp' ? 'Logged' : 'Log sent', icon: Check, onClick: () => logCommunication('whatsapp', { message: drafts.whatsapp, contact: lead.whatsapp || lead.phone }) },
        ]}
      />

      <DraftBox
        label="Instagram DM"
        value={drafts.instagram}
        onChange={v => setDrafts({ ...drafts, instagram: v })}
        actions={[
          { label: copied === 'ig' ? 'Copied' : 'Copy', icon: Copy, onClick: () => copy('ig', drafts.instagram) },
          { label: lead.instagram_handle ? 'Open Profile' : 'No Handle', icon: Instagram, onClick: openInstagram, disabled: !lead.instagram_handle },
          { label: logged === 'instagram' ? 'Logged' : 'Log sent', icon: Check, onClick: () => logCommunication('instagram', { message: drafts.instagram, contact: lead.instagram_handle }) },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => copy('brochure', drafts.brochureUrl)} className="btn-ghost"><Copy size={12} />{copied === 'brochure' ? 'Copied' : 'Copy brochure link'}</button>
        {lead.website && <button onClick={() => window.open(lead.website, '_blank')} className="btn-ghost"><ExternalLink size={12} />Website</button>}
        {lead.source_url && <button onClick={() => window.open(lead.source_url.split('|')[0]?.trim(), '_blank')} className="btn-ghost"><ExternalLink size={12} />Source</button>}
        <button onClick={() => search('web')} className="btn-ghost"><Search size={12} />Search web</button>
        <button onClick={() => search('contact')} className="btn-ghost"><Search size={12} />Find contact</button>
        <button onClick={() => search('instagram')} className="btn-ghost"><Instagram size={12} />Find IG</button>
        <button onClick={() => logCommunication('website_form', { message: 'Submitted website/contact form manually.', contact: lead.website, notes: 'Manual website/form outreach' })} className="btn-ghost"><Check size={12} />{logged === 'website_form' ? 'Logged form' : 'Log form'}</button>
      </div>
    </div>
  );
}

function CommunicationHistory({ communications, emails }) {
  const instantLogs = emails.map(e => ({
    id: `email-${e.id}`,
    channel: 'instantly',
    occurred_at: e.sent_at,
    status: e.status,
    subject: e.subject,
    message_preview: e.body_preview,
    follow_up_due: e.follow_up_due,
  }));
  const rows = [...communications, ...instantLogs]
    .sort((a, b) => String(b.occurred_at || '').localeCompare(String(a.occurred_at || '')));
  return (
    <div>
      <div className="eyebrow mb-2">Communication history · {rows.length}</div>
      <ul className="space-y-1.5">
        {rows.map(c => (
          <li key={`${c.channel}-${c.id}`} className="text-paper-dim border border-line/60 rounded-sm px-2.5 py-2">
            <div className="flex items-center gap-2">
              <span className="eyebrow eyebrow-gold">{String(c.channel).replace(/_/g, ' ')}</span>
              <StatusBadge value={c.status} />
              <span className="text-muted-dim font-mono text-[10px] tabular-nums ml-auto">
                {c.occurred_at ? new Date(c.occurred_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
              </span>
            </div>
            {(c.subject || c.message_preview) && (
              <div className="mt-1 text-[11px] text-muted line-clamp-2">{c.subject || c.message_preview}</div>
            )}
            {c.follow_up_due && (
              <div className="mt-1 text-[10px] text-gold">Follow up: {new Date(c.follow_up_due).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted italic text-[11px]">No communication logged yet.</li>}
      </ul>
    </div>
  );
}

function DraftBox({ label, value, onChange, actions }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow">{label}</div>
        <div className="flex gap-1.5">
          {actions.map(({ label: actionLabel, icon: Icon, onClick, disabled }) => (
            <button key={actionLabel} onClick={onClick} disabled={disabled} className="btn-ghost !py-1.5 !px-2.5">
              <Icon size={11} />{actionLabel}
            </button>
          ))}
        </div>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={label === 'Email' ? 9 : 5} className="input font-mono text-[11px] leading-relaxed" />
    </div>
  );
}

function buildDrafts(lead, settings) {
  const brochureUrl = settings.brochure_url || DEFAULT_BROCHURE_URL;
  const whatsapp = settings.phone_whatsapp || DEFAULT_WHATSAPP;
  const youtube = settings.youtube_url || DEFAULT_YOUTUBE;
  const name = lead.contact_name?.split(' ')[0] || 'there';
  const entity = (lead.entity_type || lead.archetype || '').replace(/_/g, ' ');
  const place = [lead.city, lead.country].filter(Boolean).join(', ');
  const angle = lead.recommended_outreach_angle || lead.recommended_topic || 'a practical music workshop';
  const context = lead.personalized_hook || lead.notes || `I came across ${lead.institution_name}${place ? ` in ${place}` : ''} and thought there may be a good fit.`;
  const offer = offerForLead(lead);
  const subject = subjectForLead(lead);

  const emailBody = `Hi ${name},

I'm Jason Zachariah, a multi-instrumentalist and music educator from Bangalore. I run Nathaniel School of Music and share lessons/performances through the Nathaniel YouTube channel.

${context}

I'm planning workshop-tour conversations and thought ${lead.institution_name} could be a strong fit for ${angle}. ${offer}

Dates are flexible. I'm building the route around institutions, venues, artists, and communities where there is genuine interest.

Workshop brochure: ${brochureUrl}
YouTube: ${youtube}
WhatsApp: ${whatsapp}

Would this be worth a short conversation?

Warmly,
Jason Zachariah`;

  const whatsappText = `Hi ${name}, Jason Zachariah here from Nathaniel School of Music, Bangalore.

${context}

I'm exploring ${angle} for ${lead.institution_name}. ${offer}

Brochure: ${brochureUrl}
YouTube: ${youtube}

Would this be of interest?`;

  const instagramText = `Hi ${name}, Jason Zachariah here from Nathaniel School of Music in Bangalore. I came across ${lead.institution_name} and thought there may be a good fit for ${angle}. ${offer}

Brochure: ${brochureUrl}
YouTube: ${youtube}

Would love to explore if this is of interest.`;

  return { emailSubject: subject, emailBody, whatsapp: whatsappText, instagram: instagramText, brochureUrl };
}

function subjectForLead(lead) {
  const entity = lead.entity_type || lead.archetype || '';
  if (entity.includes('studio')) return `Workshop / production clinic for ${lead.institution_name}`;
  if (entity.includes('venue')) return `Performance + workshop possibility`;
  if (entity.includes('choir') || entity.includes('church')) return `Vocal harmony workshop possibility`;
  if (entity.includes('artist')) return `Musician-to-musician workshop / collaboration`;
  return `Workshop possibility for ${lead.institution_name}`;
}

function offerForLead(lead) {
  const entity = lead.entity_type || lead.archetype || '';
  if (entity.includes('recording_studio')) return 'This could be a producer-to-producer clinic, DAW workflow session, or songwriting/arrangement workshop.';
  if (entity.includes('venue')) return 'This could work as a performance, an improvisation workshop, or a performance-plus-workshop evening.';
  if (entity.includes('choir') || entity.includes('a_cappella') || entity.includes('church')) return 'My mother is a choir director in Bangalore, so vocal harmony, sight-reading, and arrangement work are close to home for me.';
  if (entity.includes('artist')) return 'This could be a musician-to-musician session, guest workshop, or a way to connect with the local creative network.';
  if (entity.includes('university')) return 'This could work as a masterclass, visiting artist session, or short residency for music students.';
  return 'This could be a half-day workshop, full-day intensive, or short residency depending on what fits your students.';
}

function normalizePhoneForWa(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits : '';
}

function normalizeInstagram(raw) {
  return String(raw || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
}

function buildGmailComposeUrl({ to, subject, body, from }) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/u/${encodeURIComponent(from)}/?${params.toString()}`;
}

function DetailRow({ k, v }) {
  return (
    <div className="flex gap-3">
      <div className="w-32 shrink-0 eyebrow pt-0.5">{k}</div>
      <div className="text-paper-dim flex-1 min-w-0 break-words">{v || <span className="text-muted-dim">—</span>}</div>
    </div>
  );
}

function LeadFormDrawer({ lead, clusters, onClose, onSaved }) {
  const [form, setForm] = useState({
    cluster: lead.cluster || (clusters[0]?.name || 'Northeast'),
    city: lead.city || '', state: lead.state || '', country: lead.country || 'India',
    institution_name: lead.institution_name || '', archetype: lead.archetype || 'contemporary_academy',
    entity_type: lead.entity_type || '', subtype: lead.subtype || '',
    contact_name: lead.contact_name || '', contact_email: lead.contact_email || '',
    instagram_handle: lead.instagram_handle || '', linkedin_url: lead.linkedin_url || '', whatsapp: lead.whatsapp || '', phone: lead.phone || '', website: lead.website || '',
    recommended_topic: lead.recommended_topic || '', priority: lead.priority || 'Medium',
    personalized_hook: lead.personalized_hook || '', format_recommendation: lead.format_recommendation || '',
    language_confidence: lead.language_confidence || 'high', verification_level: lead.verification_level || '', status: lead.status || 'not_contacted',
    source_url: lead.source_url || '', source_type: lead.source_type || '',
    recommended_outreach_angle: lead.recommended_outreach_angle || '', repo_cluster: lead.repo_cluster || '', dedupe_key: lead.dedupe_key || '',
    notes: lead.notes || '', send_via: lead.send_via || 'INSTANTLY_OK',
  });
  const [genLoading, setGenLoading] = useState(false);

  const save = async () => {
    if (!form.institution_name) return alert('Institution name required');
    if (lead.id) await api.leads.update(lead.id, form);
    else await api.leads.create(form);
    onSaved();
  };

  const generateHook = async () => {
    setGenLoading(true);
    try {
      const r = await api.finder.generateHook({
        institution_name: form.institution_name, archetype: form.archetype,
        website: form.website, city: form.city, notes: form.notes,
      });
      setForm({ ...form, personalized_hook: r.hook });
    } catch (e) { alert('Hook generator: ' + e.message); }
    setGenLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-stretch justify-end z-50">
      <div className="bg-ink-900 hairline border-l w-[580px] max-w-full overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-ink-900 hairline-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="eyebrow eyebrow-gold">{lead.id ? 'Edit' : 'New'}</div>
            <h2 className="font-display text-2xl text-paper mt-0.5">{lead.id ? lead.institution_name : 'New lead'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-700 text-muted hover:text-paper transition rounded-sm"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Institution name *"><input value={form.institution_name} onChange={e => setForm({ ...form, institution_name: e.target.value })} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cluster">
              <select value={form.cluster} onChange={e => setForm({ ...form, cluster: e.target.value })} className="input">
                {clusters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Country"><input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input" /></Field>
            <Field label="City"><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" /></Field>
            <Field label="State / Region"><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Archetype">
              <select value={form.archetype} onChange={e => setForm({ ...form, archetype: e.target.value })} className="input">
                {ARCHETYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Entity type">
              <select value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })} className="input">
                <option value="">—</option>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Subtype"><input value={form.subtype} onChange={e => setForm({ ...form, subtype: e.target.value })} className="input" /></Field>
            <Field label="Send via">
              <select value={form.send_via} onChange={e => setForm({ ...form, send_via: e.target.value })} className="input">
                {SEND_VIA.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Language confidence">
              <select value={form.language_confidence} onChange={e => setForm({ ...form, language_confidence: e.target.value })} className="input">
                {LANG_CONFIDENCE.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Verification">
              <select value={form.verification_level} onChange={e => setForm({ ...form, verification_level: e.target.value })} className="input">
                <option value="">—</option>
                {VERIFICATION_LEVELS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name"><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="input" /></Field>
            <Field label="Contact email"><input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="input" /></Field>
            <Field label="Instagram"><input value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} className="input" /></Field>
            <Field label="LinkedIn"><input value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} className="input" /></Field>
            <Field label="WhatsApp"><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="input" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
          </div>
          <Field label="Website"><input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="input" /></Field>
          <Field label="Source URL"><input value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source type"><input value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })} className="input" /></Field>
            <Field label="Dedupe key"><input value={form.dedupe_key} onChange={e => setForm({ ...form, dedupe_key: e.target.value })} className="input" /></Field>
          </div>
          <Field label="Recommended topic">
            <select value={form.recommended_topic} onChange={e => setForm({ ...form, recommended_topic: e.target.value })} className="input">
              <option value="">—</option>
              {WORKSHOP_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Format recommendation"><input value={form.format_recommendation} onChange={e => setForm({ ...form, format_recommendation: e.target.value })} className="input" placeholder="e.g. Week-long residency / Half-day intensive" /></Field>
          <Field label="Recommended outreach angle"><input value={form.recommended_outreach_angle} onChange={e => setForm({ ...form, recommended_outreach_angle: e.target.value })} className="input" /></Field>
          <Field label={`Personalized hook (${form.personalized_hook.length} chars)`}>
            <textarea value={form.personalized_hook} onChange={e => setForm({ ...form, personalized_hook: e.target.value })} rows={4} className="input" />
            <button onClick={generateHook} disabled={genLoading} className="mt-1.5 text-xs flex items-center gap-1 text-highlight hover:underline disabled:opacity-50">
              <Sparkles size={12} />{genLoading ? 'Generating…' : 'AI generate hook'}
            </button>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="input" /></Field>
        </div>
        <div className="sticky bottom-0 bg-ink-900 hairline-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} className="btn-primary">{lead.id ? 'Save changes' : 'Create lead'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="eyebrow block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
