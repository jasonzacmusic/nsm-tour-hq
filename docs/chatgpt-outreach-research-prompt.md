# ChatGPT Research Prompt: NSM Tour HQ Outreach Leads

Use this prompt in a fresh ChatGPT thread when you want more outreach-ready leads for NSM Tour HQ.

```text
You are researching outreach leads for Jason Zachariah, founder of Nathaniel School of Music in Bangalore, India.

Context:
Jason is a multi-instrumentalist, music educator, YouTuber, and workshop facilitator. The goal is to find institutions, venues, artists, studios, choirs, churches, and university music ecosystems that could host or help route a paid or partnership workshop/demo/masterclass/residency.

The output will be imported into NSM Tour HQ and then used in two ways:
1. Instantly bulk email only for clean, verified email leads that are suitable for cold email.
2. Manual high-value outreach by Jason/team through personal email, WhatsApp, Instagram DM, website/contact form, or referral.

Do not assume I know the area. Do not invent contact details. Do not fill blank emails or phone numbers unless publicly verified. Use only public, verifiable sources. Preserve one source_url for every row.

Research target:
[PASTE COUNTRY/CITY/REGION LIST HERE]

Find as many relevant leads as possible, but prioritize quality and current activity over volume. Include active public sources only. Avoid closed, inactive, or unverifiable entities.

Required categories:
- music_school
- music_university
- university_music_scene
- venue
- artist
- recording_studio
- choir
- a_cappella_group
- innovative_church

For every lead, decide the best outreach route:
- INSTANTLY_OK only if there is a verified public email and the entity is appropriate for polite cold email.
- DO_NOT_USE_INSTANTLY for artists, choirs, churches, a cappella groups, delicate cultural/religious/community leads, Instagram-first leads, referral-first leads, or anything that should be hand-written.

Return CSV only. No prose before or after the CSV.

CSV columns, exactly in this order:
record_id,name,entity_type,subtype,city,state,country,website,instagram_handle,contact_email,phone,notes,priority,verification_level,source_url,source_type,recommended_outreach_angle,repo_cluster,dedupe_key,send_via

Column rules:
- record_id: short stable unique id, lowercase letters/numbers/hyphen ok.
- name: official/public name.
- entity_type: one of the required categories.
- subtype: short useful label, e.g. contemporary music school, jazz venue, youth church, choral society, indie artist, recording studio.
- city/state/country: real location.
- website: official website if available.
- instagram_handle: public Instagram handle if clearly associated.
- contact_email: verified public email only. Leave blank if unknown.
- phone: verified public phone/WhatsApp only. Leave blank if unknown.
- notes: why this lead matters and any caution.
- priority: Highest, High, Medium, or Low.
- verification_level: High only if current/active and source is official or very reliable; otherwise Medium or Low.
- source_url: required for every row.
- source_type: Official website, Instagram, university page, venue page, article, directory, etc.
- recommended_outreach_angle: specific practical angle for Jason, e.g. "half-day improvisation workshop for contemporary students", "choir harmony and arrangement clinic", "producer/DAW workflow masterclass", "artist collaboration and local scene route".
- repo_cluster: useful route cluster, e.g. Singapore, Bangkok, Dubai, Bengaluru, Cape Town.
- dedupe_key: normalized-name|city|country|normalized-website-or-instagram.
- send_via: INSTANTLY_OK or DO_NOT_USE_INSTANTLY.

Quality gates:
- Do not guess emails from domains.
- Do not use generic role emails unless they are publicly listed by the entity.
- For Instagram-only leads, leave contact_email blank and set send_via=DO_NOT_USE_INSTANTLY.
- For churches/choirs/a cappella/artists, default to DO_NOT_USE_INSTANTLY unless there is a very clear professional booking/contact email and the tone should still be personal.
- If you are not confident the entity is active/current, either omit it or set verification_level=Low and send_via=DO_NOT_USE_INSTANTLY.
- Prefer leads that could realistically host, refer, promote, or gather an audience for a demo/workshop within the next 3-6 months.
```
