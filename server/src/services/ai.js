// Provider-agnostic AI layer — bring-your-own-key.
// Supports Anthropic and OpenAI via plain fetch (no SDK dependency).

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5'
};

async function generate({ provider, apiKey, model, system, prompt, maxTokens = 1024 }) {
  if (!apiKey) {
    const err = new Error('No AI API key configured — add one in Settings');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  const m = model || DEFAULT_MODELS[provider];

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: m,
        max_tokens: maxTokens,
        system: system || undefined,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Anthropic API error (${res.status})`);
    return (data.content || []).map(b => b.text || '').join('');
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: m,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `OpenAI API error (${res.status})`);
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

module.exports = { generate, DEFAULT_MODELS };
