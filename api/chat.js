'use strict';
const { generate } = require('./_lib/gemini');
const { route, str, profileOf, SAFETY, STYLE } = require('./_lib/common');

// Free-text questions only. Starter prompts and common questions are answered on the page with no model call.
module.exports = route(async function (body, req, spend) {
  const p = profileOf(body.profile);
  const notInterested = (Array.isArray(body.notInterested) ? body.notInterested : []).slice(0, 20).map(x => str(x, 90));
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-6).map(m => ({ role: m && m.role === 'assistant' ? 'assistant' : 'user', content: str(m && m.content, 700) })).filter(m => m.content);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') { const e = new Error('Ask a question first.'); e.status = 400; throw e; }
  spend();

  const colleges = (Array.isArray(body.colleges) ? body.colleges : []).slice(0, 8).map(x => str(x && x.name, 140) + (x && x.note ? ' (' + str(x.note, 160) + ')' : '')).filter(Boolean);
  const system =
    'You are Buddy, a study abroad assistant for Indian students applying to postgraduate programs. ' +
    'Answer the question the student actually asked, directly, in at most 90 words. ' +
    'When the student asks about colleges, talk first about the colleges in COLLEGES SHOWN, using their notes and stable well known facts such as location, reputation, class format and what the course is known for. ' +
    'Give no fee, deadline, score or ranking numbers. For those, say the student can open the college and tap Check official pages. ' +
    'Never answer only by telling the student to visit a website. Answer first. ' +
    'If you are not sure of a fact, leave it out. Do not invent colleges or programs. ' +
    'Do not advise on loans, scholarships, funding or visas; say Buddy does not cover them yet. ' +
    'Never suggest a college from NOT INTERESTED. ' + SAFETY + STYLE;
  const ctx = 'Student: ' + [p.degree, p.field, p.courseDecided === 'yes' ? 'wants ' + p.course : 'course not decided', p.countryDecided === 'yes' ? p.country : 'country open', p.marks || p.scoreValue, p.budget, p.priority].filter(Boolean).join(', ') +
    '.\nCOLLEGES SHOWN: ' + (colleges.join(' | ') || 'none') + '\nNOT INTERESTED: ' + (notInterested.join(' | ') || 'none') + '.';
  const messages = msgs.slice();
  messages[0] = { role: 'user', content: ctx + '\n\nConversation:\n' + messages[0].content };
  const out = await generate({ system, messages, search: false, maxTokens: 380, timeoutMs: 20000 });
  return { text: out.text.slice(0, 1000), sources: [] };
});
