const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function select(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

export default async function handler(req, res) {
  const auth = req.headers['x-admin-password'] || req.query.p;
  if (auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const rows = await select('quiz_events', '?select=event,email,name,answer,created_at&order=created_at.desc&limit=50');
    if (!Array.isArray(rows)) return res.status(500).json({ error: 'failed to fetch' });
    const subs = rows.filter(r => r.event === 'email_submit').map(r => ({ email: r.email, name: r.name, answer: r.answer, ts: r.created_at }));
    return res.status(200).json({ recent: subs });
  } catch (err) {
    console.error('debug_submissions error:', err);
    return res.status(500).json({ error: 'failed' });
  }
}
