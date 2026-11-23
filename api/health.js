'use strict';
// GET /api/health  tells the page whether live research is available. It never reveals the key.
// GET /api/health?check=1  makes one tiny live call so you can confirm the key and model work after deploying.
const { generate } = require('./_lib/gemini');
module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const live = !!process.env.GEMINI_API_KEY;
  const out = { ok: true, live };
  if (live && /check=1/.test(req.url || '')) {
    try {
      const r = await generate({ messages: [{ role: 'user', content: 'Reply with the single word: ready' }], maxTokens: 20, timeoutMs: 25000 });
      out.check = 'working';
      out.reply = r.text.slice(0, 20);
    } catch (e) { out.check = 'failed'; out.error = String(e.message || '').slice(0, 200); }
  }
  res.statusCode = 200;
  res.end(JSON.stringify(out));
};
