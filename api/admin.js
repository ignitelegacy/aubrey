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
    const all = await select('quiz_events', '?select=event,step,archetype,email,answer,answers_payload,created_at&order=created_at.asc');

    if (!Array.isArray(all)) {
      return res.status(500).json({ error: 'failed to fetch events' });
    }

    const starts      = all.filter(e => e.event === 'quiz_start').length;
    const emails      = all.filter(e => e.event === 'email_submit').length;
    const completions = all.filter(e => e.event === 'result_view').length;
    const cta_clicks  = all.filter(e => e.event === 'cta_click').length;

    const emailRate      = starts > 0 ? Math.round((emails / starts) * 100) : 0;
    const completionRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;
    const ctaRate        = completions > 0 ? Math.round((cta_clicks / completions) * 100) : 0;

    const archetypes = { V:0, B:0, C:0, A:0 };
    all.filter(e => e.event === 'result_view' && e.archetype)
       .forEach(e => { if (archetypes[e.archetype] !== undefined) archetypes[e.archetype]++; });

    const cta_by_archetype = { V:0, B:0, C:0, A:0 };
    all.filter(e => e.event === 'cta_click' && e.archetype)
       .forEach(e => { if (cta_by_archetype[e.archetype] !== undefined) cta_by_archetype[e.archetype]++; });

    const answerEvents = all.filter(e => e.event === 'question_answer');
    const questionAnswers = [];
    for (let i = 0; i < 13; i++) {
      questionAnswers.push({ step: i, answers: answerEvents.filter(e => e.step === i).length });
    }

    const recentEmails = all
      .filter(e => e.event === 'email_submit' && e.email)
      .slice(-50)
      .reverse()
      .map(e => ({ email: e.email, ts: new Date(e.created_at).getTime() }));

    const recentSubmissions = all
      .filter(e => e.event === 'email_submit' && e.email)
      .slice(-50)
      .reverse()
      .map(e => {
        let parsed = null;
        // Prefer answers_payload if present (raw array), otherwise fall back to answer field (可能 stringified)
        try {
          if (e.answers_payload) {
            parsed = typeof e.answers_payload === 'string' ? JSON.parse(e.answers_payload) : e.answers_payload;
            // If answers_payload is an array, wrap into object for compatibility
            if (Array.isArray(parsed)) parsed = { answers: parsed };
          } else {
            parsed = typeof e.answer === 'string' ? JSON.parse(e.answer) : e.answer;
          }
        } catch (err) {
          parsed = null;
        }
        return {
          email: e.email,
          name: parsed?.name || '',
          answers: Array.isArray(parsed?.answers) ? parsed.answers : [],
          ts: new Date(e.created_at).getTime()
        };
      });

    return res.status(200).json({
      funnel: { starts, emails, completions, cta_clicks },
      rates: { emailRate, completionRate, ctaRate },
      archetypes,
      cta_by_archetype,
      questionAnswers,
      recentEmails,
      recentSubmissions,
    });
  } catch (err) {
    console.error('admin error:', err);
    return res.status(500).json({ error: 'failed to fetch stats' });
  }
}
