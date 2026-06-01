export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'no email' });

  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('GHL_WEBHOOK_URL not set');
    return res.status(500).json({ error: 'webhook not configured' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        tags: ['ignite-legacy-quiz'],
        source: 'ignite-legacy-quiz'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('GHL error:', text);
      return res.status(502).json({ error: 'GHL rejected request' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('GHL fetch error:', err);
    return res.status(500).json({ error: 'failed to reach GHL' });
  }
}
