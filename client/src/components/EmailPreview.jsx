import React from 'react';
import { highlightVars, substituteVars } from '../lib/templates.js';

export default function EmailPreview({ subject, body, lead, mode = 'compose' }) {
  if (mode === 'rendered' && lead) {
    return (
      <div className="bg-surface border border-card rounded-lg p-4">
        <div className="text-xs text-slate-400 mb-1">Subject</div>
        <div className="text-white font-medium mb-4">{substituteVars(subject, lead)}</div>
        <div className="text-xs text-slate-400 mb-1">Body</div>
        <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">{substituteVars(body, lead)}</pre>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-card rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-1">Subject</div>
      <div className="text-white font-medium mb-4">
        {highlightVars(subject).map((p, i) =>
          p.t === 'var' ? <span key={i} className="var-token">{p.v}</span> : <span key={i}>{p.v}</span>
        )}
      </div>
      <div className="text-xs text-slate-400 mb-1">Body</div>
      <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">
        {highlightVars(body).map((p, i) =>
          p.t === 'var' ? <span key={i} className="var-token">{p.v}</span> : <span key={i}>{p.v}</span>
        )}
      </pre>
    </div>
  );
}
