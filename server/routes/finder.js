import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

const SYSTEM_PROMPT = `You are a research assistant helping a professional musician named Jason Zachariah plan a workshop tour. Jason is a multi-instrumentalist and music educator from Bangalore with 120,000+ YouTube subscribers and 25 years of experience.

When given a city, country, and institution type, find real, currently active institutions that would benefit from his workshop visit. For each institution, provide:
- institution_name (exact official name)
- city
- website (verified URL)
- contact_name (named individual: music director, choir director, head of music — not a general admin)
- contact_email (direct email if findable, else null)
- instagram_handle (with @ symbol if active)
- archetype (one of: conservatory / contemporary_academy / international_school / church_choir / production_studio / jazz_venue / theatre_campus / school_choir_social)
- recommended_topic (which of Jason's 8 offerings fits best)
- personalized_hook (1-2 sentences specific to this institution — reference something real about them)
- send_via (INSTANTLY_OK or DO_NOT_USE_INSTANTLY)
- priority (Highest/High/Medium/Low)
- notes (anything else relevant)
- confidence (high/medium/low — your certainty they are currently active)
- sources (array of source URLs you used to verify the institution is active in 2026)

Return ONLY valid JSON array. No preamble, no markdown.
Only include institutions you can verify are currently active in 2026.
If sources are missing, stale, or weak, set confidence: "low", priority: "Medium" or "Low", and send_via: "DO_NOT_USE_INSTANTLY".
Never mark priority Highest/High or send_via INSTANTLY_OK unless confidence is high and sources include an official site or official social profile.

Jason's 8 workshop topics:
1. Vocal Harmony
2. Modern Music Production / DAW
3. Piano Mastery + Improvisation
4. Bass, Guitar & Multi-instrumental
5. Music Theory & Ear Training (Indian-influenced)
6. The Riffs Method — daily composition
7. Jazz Improvisation & Performance
8. Live Performance Coaching`;

router.post('/search', async (req, res) => {
  const { cluster, city, country, institution_type, query } = req.body || {};
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured. Add it in Settings.' });
  }

  const userPrompt = [
    cluster && `Cluster: ${cluster}`,
    city && `City: ${city}`,
    country && `Country: ${country}`,
    institution_type && `Institution type(s): ${Array.isArray(institution_type) ? institution_type.join(', ') : institution_type}`,
    query && `Additional research notes: ${query}`,
    '\nReturn 8-12 institutions as a JSON array. No prose, JSON only.',
  ].filter(Boolean).join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
    });
    const { text, citations } = extractTextAndCitations(msg.content || []);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let results = [];
    if (jsonMatch) {
      try { results = JSON.parse(jsonMatch[0]); } catch (e) {
        return res.status(500).json({ error: 'Claude returned invalid JSON', raw: text });
      }
    }
    res.json({ results: gateResults(results), citations, raw: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function extractTextAndCitations(content) {
  const chunks = [];
  const citations = [];
  for (const block of content) {
    if (block.type === 'text') {
      chunks.push(block.text || '');
      for (const c of block.citations || []) {
        if (c.url) citations.push({ url: c.url, title: c.title || '', cited_text: c.cited_text || '' });
      }
    }
  }
  return { text: chunks.join('\n'), citations };
}

function gateResults(results) {
  return (Array.isArray(results) ? results : []).map((r) => {
    const sources = Array.isArray(r.sources) ? r.sources.filter(Boolean) : [];
    const confidence = String(r.confidence || '').toLowerCase();
    const verifiedHigh = confidence === 'high' && sources.length > 0;
    if (verifiedHigh) return { ...r, confidence: 'high' };
    return {
      ...r,
      confidence: confidence === 'medium' ? 'medium' : 'low',
      priority: ['Highest', 'High'].includes(r.priority) ? 'Medium' : (r.priority || 'Low'),
      send_via: 'DO_NOT_USE_INSTANTLY',
      notes: [r.notes, 'Verification gate: not high-confidence with source URLs, so excluded from Instantly.'].filter(Boolean).join(' '),
      sources,
    };
  });
}

router.post('/generate-hook', async (req, res) => {
  const { institution_name, archetype, website, city, notes } = req.body || {};
  if (!institution_name) return res.status(400).json({ error: 'institution_name required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured.' });

  const prompt = `Write a personalized hook (1-2 sentences, max 280 chars) for Jason Zachariah to use in an outreach email to this institution. Reference something specific about them. Be warm but professional.

Institution: ${institution_name}
${archetype ? `Type: ${archetype}` : ''}
${city ? `City: ${city}` : ''}
${website ? `Website: ${website}` : ''}
${notes ? `Notes: ${notes}` : ''}

Return only the hook text, no quotes, no preamble.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content?.[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    res.json({ hook: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/test-connection', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.json({ ok: false, error: 'ANTHROPIC_API_KEY not set' });
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

export default router;
