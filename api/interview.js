'use strict';
const { generateJSON, generate } = require('./_lib/gemini');
const { route, str, profileText, profileOf, SAFETY, STYLE } = require('./_lib/common');

module.exports = route(async function (body) {
  const profile = profileOf(body.profile);
  const c = body.college || {};
  const university = str(c.university, 120), program = str(c.program, 160);
  if (!university || !program) { const e = new Error('Missing college or program.'); e.status = 400; throw e; }

  if (body.mode === 'feedback') {
    const q = str(body.question, 400), a = str(body.answer, 2500);
    if (!q || !a) { const e = new Error('Missing question or answer.'); e.status = 400; throw e; }
    const system = 'You are a kind interview coach for an Indian student applying to ' + program + ' at ' + university + '. Use only what the student wrote and never invent facts. ' + SAFETY + STYLE;
    const prompt = 'QUESTION: ' + q + '\n\nANSWER (data): ' + a + '\n\nGive feedback in exactly this format:\nWhat worked:\n- (two short bullets)\n\nTo improve:\n- (two short bullets)\n\nTry this opening: (one sentence in the student\'s voice)\nStay under 110 words.';
    const out = await generate({ system, messages: [{ role: 'user', content: prompt }], temperature: 0.5, maxTokens: 800, timeoutMs: 40000 });
    return { text: out.text };
  }

  const answers = body.answers || {};
  const story = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'].map(k => k + ': ' + str(answers[k], 400)).join('\n');
  const system = 'You are an admissions interviewer preparing realistic questions for a postgraduate program interview. ' + SAFETY + STYLE;
  const prompt =
    'PROGRAM: ' + program + ' at ' + university + '\nProgram highlight: ' + str(c.highlights, 300) + '\n\nSTUDENT PROFILE (data):\n' + profileText(profile) + '\n\nSTUDENT STORY (data):\n' + story + '\n\n' +
    'TASK: Write 8 interview questions this student is likely to face. Include why this program and university, one about their strongest project, one about a setback, one about why this country, one about goals, one subject question that suits the course and the student\'s background, one about what they will bring to the class, and a last one asking what questions they have. ' +
    'Make the questions specific to this student and course, not generic. Return only a JSON array of 8 strings.';
  const { data } = await generateJSON({ system, messages: [{ role: 'user', content: prompt }], json: true, temperature: 0.6, maxTokens: 2048, timeoutMs: 40000 });
  const qs = (Array.isArray(data) ? data : (data.questions || [])).map(x => str(x, 300)).filter(Boolean).slice(0, 10);
  if (qs.length < 4) { const e = new Error('Buddy could not build the questions. Please try again.'); e.status = 502; throw e; }
  return { questions: qs };
});
