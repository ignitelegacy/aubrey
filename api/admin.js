import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  /* simple password protection */
  const auth = req.headers['x-admin-password'] || req.query.p;
  if (auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    /* top-level funnel */
    const starts      = parseInt(await kv.get('stats:starts') || 0);
    const emails      = parseInt(await kv.get('stats:emails') || 0);
    const completions = parseInt(await kv.get('stats:completions') || 0);
    const cta_clicks  = parseInt(await kv.get('stats:cta_clicks') || 0);

    /* archetype distribution */
    const [V, B, C, A] = await Promise.all([
      kv.get('stats:archetype:V'),
      kv.get('stats:archetype:B'),
      kv.get('stats:archetype:C'),
      kv.get('stats:archetype:A'),
    ]);
    const archetypes = { V: parseInt(V||0), B: parseInt(B||0), C: parseInt(C||0), A: parseInt(A||0) };

    /* archetype vote distribution (early signal) */
    const [vV, vB, vC, vA] = await Promise.all([
      kv.get('stats:archetype_vote:V'),
      kv.get('stats:archetype_vote:B'),
      kv.get('stats:archetype_vote:C'),
      kv.get('stats:archetype_vote:A'),
    ]);
    const votes = { V: parseInt(vV||0), B: parseInt(vB||0), C: parseInt(vC||0), A: parseInt(vA||0) };

    /* CTA clicks by archetype */
    const [cV, cB, cC, cA] = await Promise.all([
      kv.get('stats:cta:V'),
      kv.get('stats:cta:B'),
      kv.get('stats:cta:C'),
      kv.get('stats:cta:A'),
    ]);
    const cta_by_archetype = { V: parseInt(cV||0), B: parseInt(cB||0), C: parseInt(cC||0), A: parseInt(cA||0) };

    /* drop-off: answers per question (Q0-Q11 roughly) */
    const questionAnswers = [];
    for (let i = 0; i < 12; i++) {
      const count = parseInt(await kv.get(`stats:question:${i}:answers`) || 0);
      questionAnswers.push({ step: i, answers: count });
    }

    /* recent emails (last 50) */
    const rawEmails = await kv.lrange('emails', 0, 49);
    const recentEmails = rawEmails.map(e => {
      try { return JSON.parse(e); } catch { return { email: e }; }
    });

    /* rates */
    const emailRate      = starts > 0 ? Math.round((emails / starts) * 100) : 0;
    const completionRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;
    const ctaRate        = completions > 0 ? Math.round((cta_clicks / completions) * 100) : 0;

    return res.status(200).json({
      funnel: { starts, emails, completions, cta_clicks },
      rates: { emailRate, completionRate, ctaRate },
      archetypes,
      votes,
      cta_by_archetype,
      questionAnswers,
      recentEmails,
    });
  } catch (err) {
    console.error('admin error:', err);
    return res.status(500).json({ error: 'failed to fetch stats' });
  }
}
