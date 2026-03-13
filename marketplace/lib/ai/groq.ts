// ── Groq AI client (OpenAI-compatible) ────────────────────────────────────────
// Uses native fetch — no extra SDK needed.
// Docs: https://console.groq.com/docs/openai

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type GroqResponse = {
  choices: Array<{ message: { content: string } }>;
};

export async function groqGenerate({
  model,
  messages,
  max_tokens = 1024,
}: {
  model: string;
  messages: GroqMessage[];
  max_tokens?: number;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const json = (await res.json()) as GroqResponse;
  return json.choices[0]?.message?.content?.trim() ?? '';
}
