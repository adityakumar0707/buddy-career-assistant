'use strict';
const { generate } = require('./_lib/gemini');
const { route, str, profileOf, SAFETY, STYLE } = require('./_lib/common');

// Free-text questions only. Starter prompts and common questions are answered on the page with no model call.
module.exports = route(async function (body, req, spend) {
  const p = profileOf(body.profile);
  const notInterested = (Array.isArray(body.notInterested) ? body.notInterested : []).slice(0, 20).map(x => str(x, 90));
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-4).map(m => ({ role: m && m.role === 'assistant' ? 'assistant' : 'user', content: str(m && m.content, 600) })).filter(m => m.content);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') { const e = new Error('Ask a question first.'); e.status = 400; throw e; }
  spend();

  const system =
    'You are Buddy, a study abroad assistant for Indian students applying to postgraduate programs. Answer in at most 70 words. ' +
    'Do not quote fees, deadlines or scores as facts; say the student should check the official page. ' +
    'Do not advise on loans, scholarships, funding or visas; say Buddy does not cover them yet. ' +
    'Never suggest a college from the NOT INTERESTED list. Name at most 3 colleges. ' + SAFETY + STYLE;
  const ctx = 'Student: ' + [p.degree, p.field, p.courseDecided === 'yes' ? 'wants ' + p.course : 'course not decided', p.countryDecided === 'yes' ? p.country : 'country open', p.marks || p.scoreValue].filter(Boolean).join(', ') +
    '. NOT INTERESTED: ' + (notInterested.join(' | ') || 'none') + '.';
  const messages = msgs.slice();
  messages[0] = { role: 'user', content: ctx + '\n\n' + messages[0].content };
  const out = await generate({ system, messages, search: false, maxTokens: 260, timeoutMs: 20000 });
  return { text: out.text.slice(0, 900), sources: [] };
});
