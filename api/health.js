'use strict';
// GET /api/health  tells the page whether live research is available. It never reveals the key.
// GET /api/health?check=1  makes one tiny live call so you can confirm the key and model work after deploying.
const { generate, getKey } = require('./_lib/gemini');
module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const live = !!getKey();
  const out = { ok: true, live, env: process.env.VERCEL_ENV || 'local' };
  if (!live) out.hint = 'Key not found. Variable names that look related: ' + (Object.keys(process.env).filter(function (k) { return /GEM|GOOGLE|API|KEY/i.test(k); }).map(function (k) { return JSON.stringify(k); }).join(', ') || 'none');
  if (live && /check=1/.test(req.url || '')) {
    try {
      const r = await generate({ messages: [{ role: 'user', content: 'Reply with the single word: ready' }], maxTokens: 400, timeoutMs: 25000 });
      out.check = 'working';
      out.reply = r.text.slice(0, 20);
    } catch (e) { out.check = 'failed'; out.error = String(e.message || '').slice(0, 200); }
  }
  res.statusCode = 200;
  res.end(JSON.stringify(out));
};
