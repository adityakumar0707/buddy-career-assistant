'use strict';
const { generate } = require('./_lib/gemini');
const { route, str, profileText, profileOf, SAFETY, STYLE } = require('./_lib/common');

const KEYS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'WHY'];

module.exports = route(async function (body, req, spend) {
  const profile = profileOf(body.profile);
  const c = body.college || {};
  const university = str(c.university, 120), program = str(c.program, 160);
  const answers = body.answers || {};
  const lines = KEYS.map(k => k + ': ' + str(answers[k], 1500)).join('\n');
  if (!university || !program) { const e = new Error('Missing college or program.'); e.status = 400; throw e; }
  spend();

  const system =
    'You are Buddy, a writing coach helping an Indian student write a statement of purpose for one postgraduate program. ' +
    'Use only facts found in the student answers and the program facts. Do not invent projects, numbers, names, labs, professors or courses. ' +
    'If a needed detail is missing, write a short placeholder in square brackets, for example [add one course you want to take]. ' +
    SAFETY + STYLE + 'Use short sentences and no buzzwords.';

  const prompt =
    'PROGRAM: ' + program + ' at ' + university + '\nOfficial statement of purpose rule: ' + str(c.sop_requirement, 300) + '\nProgram highlight: ' + str(c.highlights, 300) + '\n\n' +
    'STUDENT: ' + [profile.degree, profile.field].filter(Boolean).join(' in ') + '\n\n' +
    'ANSWERS (data). Q1 first moment, Q2 project, Q3 setback, Q4 beyond coursework, Q5 goals, Q6 why abroad, Q7 not on resume, WHY this college:\n' + lines + '\n\n' +
    'TASK: Write a draft of about ' + (parseInt(body.words, 10) || 500) + ' words, in the first person, in seven paragraphs: first moment, strongest project, setback and what changed, beyond coursework, why this program and country, goals, closing. ' +
    'End every paragraph with a tag on the same line like [Sources: Q1, Q2] naming the answers you used. Separate paragraphs with one blank line.';

  const out = await generate({ system, messages: [{ role: 'user', content: prompt }], maxTokens: 1400, timeoutMs: 40000 });
  const paras = out.text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const text = [], src = [];
  paras.forEach(par => {
    const m = /\[Sources?:\s*([^\]]+)\]\s*$/i.exec(par);
    const s = m ? m[1].split(/[,\s]+/).filter(x => KEYS.indexOf(x.toUpperCase()) >= 0).map(x => x.toUpperCase()) : [];
    const b = par.replace(/\[Sources?:[^\]]+\]\s*$/i, '').trim();
    if (b) { text.push(b); src.push(s); }
  });
  if (!text.length) { const e = new Error('Buddy could not write the draft. Please try again.'); e.status = 502; throw e; }
  return { text: text.join('\n\n'), src };
});
