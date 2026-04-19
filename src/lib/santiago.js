const ENDPOINT = '/api/santiago';

/**
 * Send a chat message to Santiago and get a reply.
 *
 * @param {Array} messages - Full conversation history in Anthropic format:
 *                           [{role: 'user'|'assistant', content: string}, ...]
 * @param {Object} context - Current stage info: {day, from, to, distanceKm, albergue, stageState, weatherStatus}
 * @returns {Promise<{reply: string, usage: object}>}
 */
export async function askSantiago(messages, context) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.error || errorDetail;
    } catch {
      // response wasn't JSON; use HTTP status
    }
    throw new Error(errorDetail);
  }

  const data = await res.json();
  return { reply: data.reply, usage: data.usage };
}