import React from 'react';
import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge, SendViaBadge } from './StatusBadge.jsx';
import { Mail, Globe, Instagram } from 'lucide-react';

export default function LeadCard({ lead, onCompose }) {
  return (
    <div className="bg-surface border border-card rounded-lg p-4 hover:border-accent/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">{lead.institution_name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{lead.city}{lead.state ? `, ${lead.state}` : ''} · {lead.cluster}</div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <PriorityBadge value={lead.priority} />
          <StatusBadge value={lead.status} />
        </div>
      </div>
      {lead.personalized_hook && (
        <p className="text-xs text-slate-300 mt-3 line-clamp-3">{lead.personalized_hook}</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
        {lead.contact_email && <span className="flex items-center gap-1"><Mail size={12} />{lead.contact_email}</span>}
        {lead.website && <a className="flex items-center gap-1 hover:text-highlight" href={lead.website} target="_blank" rel="noreferrer"><Globe size={12} />site</a>}
        {lead.instagram_handle && <span className="flex items-center gap-1"><Instagram size={12} />{lead.instagram_handle}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <SendViaBadge value={lead.send_via} />
        <button
          onClick={() => onCompose?.(lead)}
          className="text-xs font-medium px-2.5 py-1 bg-accent hover:bg-accent/80 text-white rounded"
        >Compose ✉</button>
      </div>
    </div>
  );
}
