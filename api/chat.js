'use strict';
const { generate } = require('./_lib/gemini');
const { route, str, profileText, profileOf, SAFETY, STYLE } = require('./_lib/common');

module.exports = route(async function (body) {
  const profile = profileOf(body.profile);
  const shortlist = (Array.isArray(body.shortlist) ? body.shortlist : []).slice(0, 14).map(x => str(x, 160));
  const notInterested = (Array.isArray(body.notInterested) ? body.notInterested : []).slice(0, 40).map(x => str(x, 160));
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-8).map(m => ({ role: m && m.role === 'assistant' ? 'assistant' : 'user', content: str(m && m.content, 1200) })).filter(m => m.content);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') { const e = new Error('Ask a question first.'); e.status = 400; throw e; }

  const system =
    'You are Buddy, a friendly study abroad assistant for Indian students applying to postgraduate programs. ' +
    'Use Google Search when you need a fact about a college, course, test or deadline, and prefer official university pages. ' +
    'If you cannot confirm a fact on an official page, say so plainly. ' +
    'Never suggest a college from the NOT INTERESTED list. Name at most 3 colleges in one answer, and tell the student to open the Shortlist tab for the full list. ' +
    'Do not give advice on loans, scholarships, funding or visas. Say Buddy does not cover them yet. ' +
    'Keep every answer under 110 words. ' + SAFETY + STYLE;

  const context =
    'STUDENT PROFILE (data):\n' + profileText(profile) + '\n\nCURRENT SHORTLIST: ' + (shortlist.join(' | ') || 'none yet') +
    '\nNOT INTERESTED: ' + (notInterested.join(' | ') || 'none');
  const messages = msgs.slice();
  messages[0] = { role: 'user', content: context + '\n\nCONVERSATION STARTS:\n' + messages[0].content };

  const out = await generate({ system, messages, search: true, temperature: 0.5, maxTokens: 4000, timeoutMs: 45000 });
  return { text: out.text.slice(0, 1800), sources: out.sources.slice(0, 4) };
});
