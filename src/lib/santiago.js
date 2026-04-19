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
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });
  } catch (err) {
    // Network error (offline, DNS, timeout) — fetch itself threw
    throw new Error('Sem ligação. O Santiago precisa de internet para responder.');
  }

  if (!res.ok) {
    let errorDetail = `Erro ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.error || errorDetail;
    } catch {
      // response wasn't JSON
    }
    // Map common statuses to friendlier messages
    if (res.status === 429) {
      throw new Error('Muitos pedidos ao mesmo tempo. Espera um momento.');
    }
    if (res.status >= 500) {
      throw new Error('O Santiago não está a responder neste momento. Tenta daqui a um bocado.');
    }
    throw new Error(errorDetail);
  }

  const data = await res.json();
  return { reply: data.reply, usage: data.usage };
}