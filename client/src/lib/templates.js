export const EMAIL_TEMPLATES = [
  {
    id: 'conservatory',
    label: 'A. Conservatory',
    subjects: [
      'Visiting musician from Bangalore — workshop possibility',
      'Workshop possibility for {{company_name}}',
      'Multi-instrumentalist visiting {{country}} — exploring interest',
    ],
    body: `Hi {{first_name}},

I'm Jason Zachariah — a multi-instrumentalist, music educator and composer from Bangalore, India. I run Nathaniel School of Music (120,000+ YouTube subscribers, online students in 30+ countries) and have been performing and teaching for 25 years.

{{personalized_hook}}

I'm planning a workshop tour in {{country}} and would love to explore whether a residency or workshop visit at {{company_name}} could work. My focus areas are:
• Music Theory & Ear Training (Indian-influenced)
• Piano Mastery + Improvisation
• Vocal Harmony & arrangement
• The Riffs Method — daily composition practice

I'm not selling courses or anything commercial — I'm offering to come and teach. If a host can cover local transport and accommodation, that's often enough. Dates are flexible — I'm building the tour around interested institutions, not the other way around.

Workshop brochure: https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0

YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

Would a 1-week residency or full-day workshop be of interest?

Warmly,
Jason`,
    followUp: `Hi {{first_name}} — just floating this back up in case it got buried. Happy to send more on the workshop format, or jump on a quick call if easier. — Jason`,
    sendVia: 'INSTANTLY_OK',
  },
  {
    id: 'contemporary_academy',
    label: 'B. Contemporary Academy',
    subjects: [
      'Workshop visit from a Bangalore multi-instrumentalist',
      'Workshop possibility for {{company_name}}',
      'Visiting musician — multi-instrumental masterclass?',
    ],
    body: `Hi {{first_name}},

I'm Jason Zachariah — a multi-instrumentalist and music educator from Bangalore. I run Nathaniel School of Music (120K+ YouTube subscribers, 4,450+ original compositions through The Riffs project, online students in 30+ countries).

{{personalized_hook}}

I'm planning a workshop tour in {{country}} and would love to spend a day or two at {{company_name}}. Topics I usually cover:
• Multi-instrumental masterclass (piano, bass, guitar, vocals)
• Modern Music Production / DAW workflow
• Vocal Harmony & arrangement
• The Riffs Method — daily composition

Flexible on dates — I'm gauging interest first and building travel around the institutions that say yes. If you can cover local transport and accommodation, that's often enough.

Brochure: https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0
YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

Would a full-day workshop be of interest?

Warmly,
Jason`,
    followUp: `Hi {{first_name}} — quick nudge in case my earlier note got buried. Let me know if a workshop visit could work for {{company_name}} this season. — Jason`,
    sendVia: 'INSTANTLY_OK',
  },
  {
    id: 'international_school',
    label: 'C. International School',
    subjects: [
      'Visiting musician — workshop for your students',
      'Guest artist visit possibility at {{company_name}}',
      'Multi-instrumentalist masterclass for your music students',
    ],
    body: `Hi {{first_name}},

I'm Jason Zachariah — a multi-instrumentalist and music educator from Bangalore. I run Nathaniel School of Music (120K+ YouTube subscribers, online students in 30+ countries).

{{personalized_hook}}

I'm planning a visit to {{country}} and would love to offer a workshop or masterclass at {{company_name}}. Formats that usually work well in international schools:
• Half-day instrumental + vocal masterclass for the music students
• Jazz improvisation session for senior students
• A 1-week residency working with band, choir and small ensembles

I'm gauging interest first and building travel around the schools that say yes. If you can cover local transport and accommodation that's often enough — flexible on dates.

Brochure: https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0
YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

Would a visit be of interest this season?

Warmly,
Jason`,
    followUp: `Hi {{first_name}} — quick follow-up in case my note got buried. Happy to send more detail or chat briefly. — Jason`,
    sendVia: 'INSTANTLY_OK',
  },
  {
    id: 'production_studio',
    label: 'D. Music Production Studio',
    subjects: [
      'Producer-to-producer — workshop visit possibility',
      'Visiting musician + producer — clinic at {{company_name}}?',
      'Daily composition + production workshop?',
    ],
    body: `Hi {{first_name}},

I'm Jason Zachariah — a multi-instrumentalist, producer and music educator from Bangalore. I run Nathaniel School of Music and Nathaniel Production House (120K+ YouTube subscribers, 4,450+ original compositions through The Riffs project).

{{personalized_hook}}

I'm planning a visit to {{country}} and would love to spend time at {{company_name}} — either as a producer-to-producer clinic for your in-house team or a workshop open to local producers. Topics I usually cover:
• Modern Music Production + DAW workflow
• Mixing/Mastering practical session
• The Riffs Method — daily composition practice as production discipline
• Home/project studio efficiency for a working musician

Flexible on dates. If local transport and accommodation can be covered that's often enough.

Brochure: https://www.dropbox.com/scl/fi/fsym5auirf2e9zpdzcsp7/Jason-Zac-Workshop-Brochure.pdf?rlkey=wd6yn0b0slmg87nzht7dh8jc6&st=0930ca6w&dl=0
YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

Would something like that be of interest?

Warmly,
Jason`,
    followUp: `Hi {{first_name}} — nudge in case my earlier note got buried. Would love to come spend time in the studio if there's interest. — Jason`,
    sendVia: 'INSTANTLY_OK',
  },
  {
    id: 'jazz_venue',
    label: 'E. Jazz Venue',
    subjects: [
      'Visiting musician from Bangalore — performance + workshop?',
      'Jazz performance + improvisation workshop possibility',
      'Visiting from India — open to playing your room?',
    ],
    body: `Hi {{first_name}},

I'm Jason Zachariah — a multi-instrumentalist from Bangalore (120K+ YouTube subscribers, 25 years performing). I run Nathaniel School of Music and Nathaniel Production House.

{{personalized_hook}}

I'm planning a visit to {{country}} and would love to come perform at {{company_name}} and run a short workshop alongside — improvisation, time feel, jamming as a band. Happy to play any genre that fits your room — jazz, blues, contemporary, world.

Flexible on dates. If local transport and accommodation can be covered that's often enough.

YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

Would either a performance or a performance + workshop combo work for you?

Warmly,
Jason`,
    followUp: `Hi {{first_name}} — quick nudge. Still hoping to play your room if a slot opens up. — Jason`,
    sendVia: 'INSTANTLY_OK',
  },
  {
    id: 'church_choir',
    label: 'F. Hand-written (Church / Cultural)',
    subjects: [
      'A note from a visiting musician',
      'Greetings from Bangalore',
      'Visiting {{city}} — would love to support the choir',
    ],
    body: `Dear {{first_name}},

My name is Jason Zachariah. I'm a multi-instrumentalist and music educator from Bangalore, India. I grew up in a musical family and have been performing and teaching for over 25 years — these days I share most of my work through Nathaniel School of Music on YouTube (120,000+ subscribers, online students in 30+ countries).

{{personalized_hook}}

I'd be honoured to come visit, support your choir or music ministers, and offer a workshop on vocal harmony, arrangement, or sacred music — whatever you feel would help most. This is not commercial — I'm offering to come and teach. If a host can cover local transport and accommodation that's often enough.

Dates are flexible. I'm building the tour around the institutions that say yes.

YouTube: youtube.com/nathanielschool
WhatsApp: +91 98454 65411

I'd love to hear back if this resonates.

With warm regards,
Jason Zachariah`,
    followUp: `Dear {{first_name}} — gently following up on my earlier note. I'd love to hear back if a visit to {{company_name}} could work. With warm regards, Jason`,
    sendVia: 'DO_NOT_USE_INSTANTLY',
  },
];

export function getTemplate(id) {
  return EMAIL_TEMPLATES.find(t => t.id === id) || EMAIL_TEMPLATES[0];
}

export function substituteVars(text, lead) {
  if (!text) return '';
  const firstName = (lead?.contact_name || '').split(' ')[0] || 'there';
  return String(text)
    .replaceAll('{{first_name}}', firstName)
    .replaceAll('{{company_name}}', lead?.institution_name || '')
    .replaceAll('{{personalized_hook}}', lead?.personalized_hook || '')
    .replaceAll('{{country}}', lead?.country || '')
    .replaceAll('{{city}}', lead?.city || '');
}

export function highlightVars(text) {
  if (!text) return [];
  const parts = [];
  const re = /(\{\{[a-z_]+\}\})/g;
  let last = 0; let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: 'text', v: text.slice(last, m.index) });
    parts.push({ t: 'var', v: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: 'text', v: text.slice(last) });
  return parts;
}
