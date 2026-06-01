export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'no email' });

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!token || !locationId) {
    console.error('GHL_API_TOKEN or GHL_LOCATION_ID not set');
    return res.status(500).json({ error: 'GHL not configured' });
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        email,
        locationId,
        tags: ['ignite-legacy-quiz'],
        source: 'Ignite Legacy Quiz'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('GHL error:', response.status, text);
      return res.status(502).json({ error: 'GHL rejected request' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('GHL fetch error:', err);
    return res.status(500).json({ error: 'failed to reach GHL' });
  }
}
