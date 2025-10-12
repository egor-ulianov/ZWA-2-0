export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { html } = req.body || {};
    if (typeof html !== 'string' || html.trim() === '') {
      return res.status(400).json({ error: 'Missing html string in body' });
    }
    const response = await fetch('https://validator.w3.org/nu/?out=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'User-Agent': 'ZWA-Validator-Proxy'
      },
      body: html
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}


