import React, { useState } from 'react';
import { Film, Image as ImageIcon, Folder, Terminal, ChevronDown } from 'lucide-react';

const COMPOSITIONS = [
  { id: 'TourPromo', title: 'Tour Promo', dur: '60s', dim: '1920×1080', kind: 'video', icon: Film, fields: ['title', 'countries', 'featuredPhoto'] },
  { id: 'InstagramReel', title: 'Instagram Reel', dur: '30s', dim: '1080×1920', kind: 'video', icon: Film, fields: ['cityName', 'clusterName', 'photos'] },
  { id: 'WorkshopPoster', title: 'Workshop Poster', dur: 'still', dim: '1080×1080', kind: 'image', icon: ImageIcon, fields: ['institutionName', 'city', 'topicList', 'backgroundPhoto'] },
  { id: 'ClusterIntro', title: 'Cluster Intro', dur: '15s', dim: '1920×1080', kind: 'video', icon: Film, fields: ['clusterName', 'cities', 'institutionCount'] },
  { id: 'StatsCard', title: 'Stats Card', dur: 'anim', dim: '1080×1080', kind: 'image', icon: ImageIcon, fields: [] },
];

export default function RemotionStudio() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-full">
      <header className="px-12 pt-10 pb-6 hairline-b">
        <div className="eyebrow eyebrow-gold">Section 05 · Promo Reel</div>
        <h1 className="font-display text-[44px] leading-tight text-paper mt-1.5">Remotion <span className="italic text-gold">Studio</span></h1>
        <p className="text-[13px] text-muted mt-2 max-w-xl">Five compositions, code-rendered. Drop photos into the assets folder, then render from the project.</p>
      </header>

      <div className="px-12 py-8 space-y-8">
        <div className="card-feature p-5 flex items-start gap-4">
          <Terminal size={16} className="text-gold shrink-0 mt-0.5" />
          <div className="text-[12px] text-paper-dim leading-relaxed">
            <div className="text-paper font-semibold mb-1">Open the interactive studio</div>
            <code className="text-gold font-mono text-[12px]">npm run remotion:studio</code>
            <div className="text-paper font-semibold mt-3 mb-1">Render a composition</div>
            <code className="text-gold font-mono text-[12px]">npm run remotion:render -- --composition=TourPromo --output=out/tour_promo.mp4</code>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {COMPOSITIONS.map((c, i) => {
            const Icon = c.icon;
            const open = expanded === c.id;
            return (
              <div key={c.id} className="card overflow-hidden fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="aspect-video relative flex items-center justify-center overflow-hidden"
                  style={{ background: 'radial-gradient(120% 120% at 30% 20%, rgba(224,169,74,0.18), transparent 60%), linear-gradient(160deg,#23252F,#15161D)' }}>
                  <Icon size={36} className="text-gold/70" />
                  <span className="absolute bottom-2 right-3 font-mono text-[10px] text-muted">{c.dim}</span>
                  <span className="absolute top-2 left-3 eyebrow">{c.kind}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="font-display text-[18px] text-paper">{c.title}</div>
                    <span className="font-mono text-[11px] text-gold">{c.dur}</span>
                  </div>
                  <button onClick={() => setExpanded(open ? null : c.id)}
                    className="mt-3 eyebrow hover:text-gold flex items-center gap-1 transition">
                    Customise & render <ChevronDown size={11} className={open ? 'rotate-180 transition' : 'transition'} />
                  </button>
                  {open && (
                    <div className="mt-4 space-y-2.5 text-[12px] hairline-t pt-4">
                      {c.fields.length === 0 && <div className="text-muted italic">No props — uses defaults.</div>}
                      {c.fields.map(f => (
                        <div key={f}>
                          <label className="eyebrow block mb-1">{f}</label>
                          <input className="input text-[12px]" placeholder={`Override ${f}`} />
                        </div>
                      ))}
                      <div className="pt-2 text-[11px] text-muted">
                        <code className="text-gold font-mono">--composition={c.id}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Folder size={15} className="text-gold" />
            <h3 className="font-display text-lg text-paper">Photo / asset manager</h3>
          </div>
          <p className="text-[12px] text-muted">Drop JPG / PNG / MP4 files into:</p>
          <code className="text-gold font-mono text-[12px] mt-1.5 block">~/Documents/Claude Code/nsm-tour-hq/remotion/src/assets/</code>
          <p className="text-[12px] text-muted mt-2">Remotion auto-detects what's there. Restart the studio after adding files.</p>
        </div>
      </div>
    </div>
  );
}
