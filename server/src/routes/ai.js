// AI settings + drafting endpoints — Phase 2, Sprint 6.
const express = require('express');
const ai = require('../services/ai');
const { encrypt, decrypt } = require('../services/youtube'); // shared AES helpers

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  async function getSettings(userId) {
    const r = await pool.query(`SELECT * FROM oc_ai_settings WHERE user_id = $1`, [userId]);
    return r.rows[0] || null;
  }

  // GET /api/ai/settings — never returns the key itself
  router.get('/settings', authMiddleware, async (req, res) => {
    try {
      const s = await getSettings(req.user.id);
      res.json({
        configured: !!(s && s.api_key),
        provider: s ? s.provider : 'anthropic',
        model: s ? s.model : null,
        defaults: ai.DEFAULT_MODELS
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/ai/settings — save provider/model/key (key optional on update)
  router.post('/settings', authMiddleware, async (req, res) => {
    try {
      const { provider, model, api_key } = req.body;
      if (!['anthropic', 'openai'].includes(provider)) {
        return res.status(400).json({ error: 'Provider must be anthropic or openai' });
      }
      const enc = api_key ? encrypt(api_key) : null;
      await pool.query(
        `INSERT INTO oc_ai_settings (user_id, provider, model, api_key)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET
           provider = EXCLUDED.provider,
           model = EXCLUDED.model,
           api_key = COALESCE(EXCLUDED.api_key, oc_ai_settings.api_key),
           updated_at = NOW()`,
        [req.user.id, provider, model || null, enc]
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  const PROMPTS = {
    titles: (ctx) => ({
      system: 'You are a YouTube packaging expert. High CTR without clickbait that betrays the content — the 2026 algorithm punishes misleading packaging via satisfaction surveys and retention-curve shape.',
      prompt: `Suggest exactly 5 title candidates for this ${ctx.type === 'short' ? 'YouTube Short' : 'YouTube video'}.
Return them as a plain numbered list, nothing else.

Working title: ${ctx.title}
Concept: ${ctx.concept || '(none)'}
Target viewer: ${ctx.target_viewer || '(none)'}
Promise to the viewer: ${ctx.promise || '(none)'}`
    }),
    hook: (ctx) => ({
      system: 'You are a YouTube retention expert. The first 30 seconds decide the retention curve. No throat-clearing, no "welcome back to the channel".',
      prompt: `Write a first-30-seconds hook script for this ${ctx.type === 'short' ? 'Short' : 'video'}. 60-90 spoken words. Open on the tension or payoff, then promise what is coming.

Title: ${ctx.title}
Concept: ${ctx.concept || '(none)'}
Target viewer: ${ctx.target_viewer || '(none)'}
Promise: ${ctx.promise || '(none)'}`
    }),
    outline: (ctx) => ({
      system: 'You are a YouTube story-structure expert. Beats should hold retention: change something on screen or in stakes regularly, front-load value, tease the payoff.',
      prompt: `Write a beat outline (6-10 beats, one per line, no numbering) for this ${ctx.type === 'short' ? 'Short' : 'video'}.

Title: ${ctx.title}
Concept: ${ctx.concept || '(none)'}
Promise: ${ctx.promise || '(none)'}
Hook (already written): ${ctx.hook || '(none)'}`
    }),
    description: (ctx) => ({
      system: 'You are a YouTube metadata expert. Descriptions: first 2 lines carry the click, then context, then a call to action. Tags: specific over generic.',
      prompt: `Write a YouTube description (under 150 words) and tags for this ${ctx.type === 'short' ? 'Short' : 'video'}.
Format your reply exactly as:
DESCRIPTION:
<description>
TAGS:
<comma-separated tags, max 15>

Title: ${ctx.title}
Concept: ${ctx.concept || '(none)'}
Script excerpt: ${(ctx.script || '').slice(0, 2000) || '(no script yet)'}`
    })
  };

  // POST /api/ai/draft { content_id, kind } — kind: titles|hook|outline|description
  router.post('/draft', authMiddleware, async (req, res) => {
    try {
      const { content_id, kind } = req.body;
      if (!PROMPTS[kind]) return res.status(400).json({ error: `Unknown draft kind: ${kind}` });

      const s = await getSettings(req.user.id);
      if (!s || !s.api_key) {
        return res.status(400).json({ error: 'No AI API key configured — add one in Settings' });
      }

      const cRes = await pool.query(
        `SELECT * FROM oc_content WHERE id = $1 AND user_id = $2`,
        [content_id, req.user.id]
      );
      if (!cRes.rows.length) return res.status(404).json({ error: 'Content not found' });
      const item = cRes.rows[0];
      const b = item.brief || {};

      const ctx = {
        title: item.title,
        type: item.content_type,
        concept: b.concept,
        target_viewer: b.target_viewer,
        promise: b.promise,
        hook: b.hook,
        script: item.script
      };
      const { system, prompt } = PROMPTS[kind](ctx);

      const text = await ai.generate({
        provider: s.provider,
        apiKey: decrypt(s.api_key),
        model: s.model,
        system,
        prompt,
        maxTokens: kind === 'outline' || kind === 'description' ? 1024 : 600
      });

      res.json({ kind, text: text.trim() });
    } catch (e) {
      console.error('AI draft error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
