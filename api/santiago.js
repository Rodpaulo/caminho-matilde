const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20250929';

export default async function handler(req, res) {
  // Only accept POST for real calls; GET is just a health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'alive',
      model: MODEL,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const { messages, system } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: system || 'You are a helpful assistant. Reply in Portuguese.',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Anthropic API error: ${response.status}`,
        detail: errorText,
      });
    }

    const data = await response.json();

    // Extract the text reply for simpler client consumption
    const reply = data.content
      ?.filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n') || '';

    return res.status(200).json({
      reply,
      usage: data.usage, // lets us monitor token consumption
    });
  } catch (err) {
    console.error('Santiago error:', err);
    return res.status(500).json({ error: err.message });
  }
}