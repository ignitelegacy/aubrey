const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { event, step, answer, archetype_vote, archetype, email, ts } = req.body;
  // Lightweight logging to help debug why submissions may not be appearing in Supabase
  try {
    console.log('TRACK EVENT:', { event, step, email, ts, answer: answer ? (answer.length > 200 ? answer.slice(0,200)+'...' : answer) : null });
  } catch (e) { /* ignore logging failures */ }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ event, step, answer, archetype_vote, archetype, email, ts })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Supabase insert error:', text);
      return res.status(500).json({ error: 'failed to track event', detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track error:', err);
    return res.status(500).json({ error: 'tracking failed' });
  }
}
