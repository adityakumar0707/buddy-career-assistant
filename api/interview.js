'use strict';
const { generate } = require('./_lib/gemini');
const { route, str, SAFETY, STYLE } = require('./_lib/common');

// Interview questions come from a fixed bank on the page. The model is used only to give feedback on a typed answer.
module.exports = route(async function (body, req, spend) {
  const c = body.college || {};
  const university = str(c.university, 120), program = str(c.program, 160);
  const q = str(body.question, 400), a = str(body.answer, 1800);
  if (!university || !program || !q || !a) { const e = new Error('Missing question or answer.'); e.status = 400; throw e; }
  spend();
  const system = 'You are a kind interview coach for an Indian student applying to ' + program + ' at ' + university + '. Use only what the student wrote. ' + SAFETY + STYLE;
  const prompt = 'QUESTION: ' + q + '\n\nANSWER (data): ' + a + '\n\nFormat:\nWhat worked:\n- (two short bullets)\n\nTo improve:\n- (two short bullets)\n\nTry this opening: (one sentence)\nUnder 90 words.';
  const out = await generate({ system, messages: [{ role: 'user', content: prompt }], maxTokens: 320, timeoutMs: 20000 });
  return { text: out.text };
});
