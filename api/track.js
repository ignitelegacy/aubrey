import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { event, step, answer, archetype_vote, archetype, email, ts } = req.body;

  try {
    if (event === 'quiz_start') {
      await kv.incr('stats:starts');
      await kv.incr(`stats:starts:${dateKey()}`);
    }

    if (event === 'question_answer') {
      await kv.incr(`stats:question:${step}:answers`);
      if (archetype_vote) await kv.incr(`stats:archetype_vote:${archetype_vote}`);
    }

    if (event === 'email_submit') {
      await kv.incr('stats:emails');
      await kv.incr(`stats:emails:${dateKey()}`);
      /* store email with timestamp */
      if (email) {
        await kv.lpush('emails', JSON.stringify({ email, ts: ts || Date.now() }));
      }
    }

    if (event === 'result_view') {
      await kv.incr('stats:completions');
      if (archetype) await kv.incr(`stats:archetype:${archetype}`);
    }

    if (event === 'cta_click') {
      await kv.incr('stats:cta_clicks');
      if (archetype) await kv.incr(`stats:cta:${archetype}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track error:', err);
    return res.status(500).json({ error: 'tracking failed' });
  }
}

function dateKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
