export const ARCHETYPES = [
  { value: 'conservatory', label: 'Conservatory' },
  { value: 'contemporary_academy', label: 'Contemporary Academy' },
  { value: 'international_school', label: 'International School' },
  { value: 'production_studio', label: 'Music Production Studio' },
  { value: 'jazz_venue', label: 'Jazz Venue' },
  { value: 'church_choir', label: 'Church / Choir / Cultural' },
  { value: 'theatre_campus', label: 'Theatre / Cultural Campus' },
  { value: 'school_choir_social', label: 'School Choir (social)' },
];

export const PRIORITIES = ['Highest', 'High', 'Medium', 'Low'];

export const STATUSES = [
  { value: 'not_contacted', label: 'Not contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'follow_up_sent', label: 'Follow-up sent' },
  { value: 'closed', label: 'Closed' },
];

export const SEND_VIA = [
  { value: 'INSTANTLY_OK', label: 'OK for Instantly' },
  { value: 'DO_NOT_USE_INSTANTLY', label: 'Hand-written only' },
];

export const LANG_CONFIDENCE = ['high', 'medium', 'low'];

export const WORKSHOP_TOPICS = [
  'Vocal Harmony',
  'Modern Music Production / DAW',
  'Piano Mastery + Improvisation',
  'Bass, Guitar & Multi-instrumental',
  'Music Theory & Ear Training (Indian-influenced)',
  'The Riffs Method — daily composition',
  'Jazz Improvisation & Performance',
  'Live Performance Coaching',
];

export const PRIORITY_COLORS = {
  Highest: 'bg-accent text-white',
  High: 'bg-highlight text-primary',
  Medium: 'bg-card text-slate-100',
  Low: 'bg-surface text-slate-300',
};

export const STATUS_COLORS = {
  not_contacted: 'bg-surface text-slate-300',
  contacted: 'bg-card text-slate-100',
  replied: 'bg-success text-white',
  follow_up_sent: 'bg-highlight text-primary',
  closed: 'bg-slate-700 text-slate-300',
};
