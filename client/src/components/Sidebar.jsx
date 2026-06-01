import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, List, Mail, Search, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../lib/api.js';

const links = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard', num: '01' },
  { to: '/leads', icon: List, label: 'Leads', num: '02' },
  { to: '/email', icon: Mail, label: 'Outreach', num: '03' },
  { to: '/finder', icon: Search, label: 'School Finder', num: '04' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings', num: '05' },
];

export default function Sidebar() {
  const [health, setHealth] = useState(null);
  useEffect(() => { api.health().then(setHealth).catch(() => {}); }, []);

  return (
    <aside className="w-64 shrink-0 flex flex-col relative border-r border-line"
      style={{ background: 'linear-gradient(180deg,#16171F 0%,#121319 100%)' }}>
      {/* Brand */}
      <div className="px-7 pt-8 pb-6 hairline-b">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-black text-[34px] leading-none text-paper">NSM</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rust mb-1.5" />
        </div>
        <div className="eyebrow eyebrow-gold mt-2.5">Tour Headquarters</div>
        <p className="mt-3.5 text-[11px] text-muted leading-relaxed">
          Outreach console for the<br />
          <span className="text-paper-dim font-display italic text-[13px]">Nathaniel School of Music</span> tour.
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {links.map(({ to, icon: Icon, label, num }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-7 py-3 text-[13px] transition-all ${
                isActive ? 'text-paper' : 'text-paper-dim hover:text-paper'
              }`}>
            {({ isActive }) => (
              <>
                <span className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r ${isActive ? 'bg-gold' : 'bg-transparent group-hover:bg-line-bright'}`} />
                {isActive && <span className="absolute inset-0 bg-gradient-to-r from-gold/[0.08] to-transparent" />}
                <span className="relative font-mono text-[10px] tabular-nums text-muted-dim w-5">{num}</span>
                <Icon size={15} strokeWidth={1.5} className="relative" />
                <span className="relative tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="px-7 py-5 hairline-t space-y-3">
        <div className="eyebrow text-[9px]">System</div>
        <StatusRow label="Database" ok={!!health} count={health?.leadCount} />
        <StatusRow label="Instantly API" ok={health?.instantlyConfigured} />
        <StatusRow label="Claude API" ok={health?.anthropicConfigured} />
      </div>

      <div className="px-7 pt-4 pb-6 hairline-t">
        <div className="font-display italic text-paper text-[15px]">Jason Zachariah</div>
        <div className="eyebrow mt-1.5 text-[9px]">Bangalore · India</div>
      </div>
    </aside>
  );
}

function StatusRow({ label, ok, count }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-paper-dim">{label}</span>
      <span className="flex items-center gap-2">
        {count !== undefined && <span className="font-mono tabular-nums text-muted">{count}</span>}
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-sage pulse-dot' : 'bg-rust/70'}`} />
      </span>
    </div>
  );
}
