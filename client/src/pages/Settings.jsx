import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState({
    from_name: 'Jason Zachariah',
    sender_email: 'music@nathanielschool.com',
    phone_whatsapp: '+91 98454 65411',
    youtube_url: 'https://youtube.com/nathanielschool',
    website: 'https://nathanielschool.com',
    instagram: '@nathanielschoolofmusic',
    brochure_url: 'https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0',
    send_window_start: '09:00',
    send_window_end: '17:00',
  });
  const [gmailTest, setGmailTest] = useState(null);
  const [aiTest, setAiTest] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.health().then(setHealth);
    api.settings.get().then(s => setSettings(prev => ({ ...prev, ...s })));
  }, []);

  const save = async () => { await api.settings.put(settings); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const testGmail = async () => { setGmailTest({ pending: true }); setGmailTest(await api.emails.testConnection()); };
  const testAi = async () => { setAiTest({ pending: true }); setAiTest(await api.finder.testConnection()); };

  return (
    <div className="min-h-full">
      <header className="px-12 pt-10 pb-6 hairline-b">
        <div className="eyebrow eyebrow-gold">Section 06 · Configuration</div>
        <h1 className="font-display text-[44px] leading-tight text-paper mt-1.5">Settings</h1>
      </header>

      <div className="px-12 py-8 max-w-3xl space-y-6">
        <Section title="Connections" eyebrow="Required before sending">
          <ConnRow label="Gmail SMTP" ok={health?.gmailConfigured} onTest={testGmail} test={gmailTest} />
          <ConnRow label="Anthropic API" ok={health?.anthropicConfigured} onTest={testAi} test={aiTest} />
          <div className="text-[12px] text-muted hairline-t pt-3 mt-1">
            Set keys in <code className="text-gold font-mono">~/Documents/Claude Code/nsm-tour-hq/.env</code> then restart the server.
          </div>
        </Section>

        <Section title="Sender profile" eyebrow="Used in every email signature">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display name" v={settings.from_name} k="from_name" set={setSettings} s={settings} />
            <Field label="Sending email" v={settings.sender_email} k="sender_email" set={setSettings} s={settings} />
            <Field label="WhatsApp / phone" v={settings.phone_whatsapp} k="phone_whatsapp" set={setSettings} s={settings} />
            <Field label="YouTube URL" v={settings.youtube_url} k="youtube_url" set={setSettings} s={settings} />
            <Field label="Website" v={settings.website} k="website" set={setSettings} s={settings} />
            <Field label="Instagram" v={settings.instagram} k="instagram" set={setSettings} s={settings} />
          </div>
          <Field label="Brochure URL" v={settings.brochure_url} k="brochure_url" set={setSettings} s={settings} />
        </Section>

        <Section title="Send window" eyebrow="Recipient timezone">
          <div className="flex items-center gap-4">
            <Field label="From" v={settings.send_window_start} k="send_window_start" set={setSettings} s={settings} />
            <Field label="To" v={settings.send_window_end} k="send_window_end" set={setSettings} s={settings} />
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button onClick={save} className="btn-primary">Save settings</button>
          {saved && <span className="text-[12px] text-sage flex items-center gap-1"><Check size={13} /> Saved</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, eyebrow, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="font-display text-xl text-paper mt-1">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, v, k, set, s }) {
  return (
    <div className="flex-1">
      <label className="eyebrow block mb-1.5">{label}</label>
      <input className="input" value={v} onChange={e => set({ ...s, [k]: e.target.value })} />
    </div>
  );
}

function ConnRow({ label, ok, onTest, test }) {
  return (
    <div>
      <div className="flex items-center gap-3 text-[13px]">
        <div className="w-36 text-paper-dim">{label}</div>
        {ok
          ? <span className="text-[11px] px-2 py-0.5 rounded-sm bg-sage/15 border border-sage/40 text-sage inline-flex items-center gap-1"><Check size={10} /> Configured</span>
          : <span className="text-[11px] px-2 py-0.5 rounded-sm bg-gold/10 border border-gold/40 text-gold inline-flex items-center gap-1"><AlertCircle size={10} /> Not set in .env</span>}
        <button onClick={onTest} className="eyebrow hover:text-gold ml-auto flex items-center gap-1"><RefreshCw size={11} /> Test</button>
      </div>
      {test && !test.pending && (
        <div className={`text-[12px] mt-2 px-3 py-2 rounded ${test.ok ? 'bg-sage/10 text-sage' : 'bg-rust/10 text-rust-hi'}`}>
          {test.ok ? '✓ Connection works' : `✗ ${test.error}`}
        </div>
      )}
    </div>
  );
}
