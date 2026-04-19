const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20250929';

// Keep the most recent N turns of conversation for context.
// Older messages are dropped from what we send to Anthropic (but still shown to the user).
// 20 turns = up to 10 user messages + 10 assistant replies.
const MAX_CONTEXT_MESSAGES = 20;

// Rough guardrail against runaway conversations.
// Not strictly enforced per-user (no auth), but prevents a single request from
// shipping absurdly long histories that would cost a lot per call.
const MAX_MESSAGES_PER_REQUEST = 200;

const SYSTEM_PROMPT = `És o Santiago, um companheiro do Caminho Português para a Matilde, que está a fazer o caminho de Porto a Santiago de Compostela em 11 etapas.

Quem és:
Um amigo imaginário que já fez o Caminho muitas vezes. Não és o santo — és um companheiro de estrada, talvez um peregrino mais velho. Conheces bem o terreno, os albergues, a comida, as línguas da região (português, espanhol, galego), e a experiência de caminhar longas distâncias.

Como respondes:
Responde SEMPRE em português de Portugal, mesmo se a Matilde escrever noutro idioma.
Adapta o tom à pergunta: prático e conciso para questões práticas ("onde compro vaselina"), caloroso e presente para momentos difíceis ("os pés doem-me tanto"). Em conversas reflexivas, prefere uma boa pergunta a um discurso. Respostas curtas costumam ser melhores.
Nunca falas de forma pomposa, moralista, ou auto-ajuda genérica.
Nunca impões conselhos não pedidos.

O que sabes da Matilde:
Vais receber no sistema a etapa em que ela está hoje, a distância, o albergue, e como ela se está a sentir (se ela disse). Usa esta informação naturalmente — sem o anunciar.
Ela tem um pai que adora e que lhe criou esta app. Há uma página que mostra apenas o que ela escolher partilhar. O resto é privado. Nunca tentas saber o conteúdo das entradas privadas do diário.

O que não sabes:
Não tens acesso a clima em tempo real, horários de comboios, disponibilidade em albergues, ou notícias do dia. Se ela perguntar algo destes tipos, diz que não sabes e sugere onde ela pode verificar.
Não podes fazer reservas, chamadas, ou enviar mensagens.

Limites importantes:
Para questões médicas, podes dar ideias básicas sobre bolhas, cansaço muscular, desidratação. Para qualquer sintoma mais grave (dor no peito, febre alta, tonturas persistentes), diz-lhe para ligar 112 em Portugal ou 112 em Espanha, sem hesitar.
Se ela mencionar desistir ou sentimentos muito difíceis, ouves primeiro. Podes, se parecer certo, lembrá-la suavemente que o pai está só a uma chamada de distância. Mas não a pressiones.

Sê tu mesmo. Tens personalidade. Um sentido de humor seco às vezes. Mas sobretudo, estás presente.`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'alive',
      model: MODEL,
      maxContext: MAX_CONTEXT_MESSAGES,
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
    const { messages, context } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Guardrail: refuse absurdly long conversations
    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return res.status(400).json({
        error: 'Conversation too long. Please start a new one.',
      });
    }

    // Trim history to the most recent MAX_CONTEXT_MESSAGES messages.
    // This keeps per-request costs predictable even as conversations grow.
    const trimmedMessages = messages.length > MAX_CONTEXT_MESSAGES
      ? messages.slice(-MAX_CONTEXT_MESSAGES)
      : messages;

    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      const contextLines = [];
      if (context.day) contextLines.push(`Hoje é o dia ${context.day} do Caminho.`);
      if (context.from && context.to) contextLines.push(`Etapa: ${context.from} → ${context.to}.`);
      if (context.distanceKm) contextLines.push(`Distância da etapa: ${context.distanceKm} km.`);
      if (context.albergue) contextLines.push(`Albergue previsto: ${context.albergue}.`);
      if (context.stageState === 'walking') contextLines.push(`Estado: está a caminhar.`);
      if (context.stageState === 'arrived') contextLines.push(`Estado: já chegou ao albergue hoje.`);
      if (context.stageState === 'not-started') contextLines.push(`Estado: ainda não começou a etapa de hoje.`);
      if (context.weatherStatus) contextLines.push(`Como se está a sentir: ${context.weatherStatus}.`);

      if (contextLines.length > 0) {
        systemPrompt += '\n\nSituação atual da Matilde:\n' + contextLines.join('\n');
      }
    }

    // If we trimmed, let Santiago know so he doesn't pretend to remember older turns
    if (messages.length > MAX_CONTEXT_MESSAGES) {
      systemPrompt += `\n\nNota: esta conversa já é longa. Tens acesso às últimas ${MAX_CONTEXT_MESSAGES} mensagens. Mensagens anteriores não estão visíveis para ti. Se a Matilde se referir a algo que não vês, podes pedir-lhe que te relembre.`;
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
        system: systemPrompt,
        messages: trimmedMessages,
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
    const reply = data.content
      ?.filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n') || '';

    return res.status(200).json({
      reply,
      usage: data.usage,
      trimmed: messages.length > MAX_CONTEXT_MESSAGES,
    });
  } catch (err) {
    console.error('Santiago error:', err);
    return res.status(500).json({ error: err.message });
  }
}