'use strict';
const { generateJSON } = require('./_lib/gemini');
const { route, str, slug, httpsUrl, profileText, profileOf, SAFETY, STYLE } = require('./_lib/common');

module.exports = route(async function (body) {
  const profile = profileOf(body.profile);
  const count = Math.min(Math.max(parseInt(body.count, 10) || 6, 2), 10);
  const theme = ['fit', 'notest', 'explore'].indexOf(body.theme) >= 0 ? body.theme : 'fit';
  const THEMES = {
    fit: 'Pick the programs that best match this student\'s background, course and marks.',
    notest: 'Pick only programs that do not require an entrance test such as GRE, GMAT or LSAT, or where it is clearly optional or waived, as stated on the official page. Skip any program where you cannot confirm this.',
    explore: 'Pick programs that widen the student\'s view: closely related courses they may not have considered, or the same course in a country they have not named. Keep every program realistic for their background.'
  };
  const exclude = (Array.isArray(body.exclude) ? body.exclude : []).slice(0, 40).map(x => str(x, 160));

  const system =
    'You are Buddy, a careful study abroad advisor for Indian students applying to postgraduate programs. ' +
    'Use Google Search to find real, currently offered postgraduate programs. Confirm each one on the university\'s official website. ' +
    SAFETY + STYLE;

  const prompt =
    'STUDENT PROFILE (data):\n' + profileText(profile) + '\n\n' +
    'TASK: Suggest ' + count + ' postgraduate programs for this student. ' + THEMES[theme] + '\n' +
    'Rules:\n' +
    '1. Fit the student\'s own background and goal. A law graduate gets law programs, a biotech graduate gets life science programs, a commerce or CA graduate gets finance, accounting or management programs, and so on. Do not default to computer science.\n' +
    '2. If the course is decided, every program must be that course or the closest official equivalent. If it is not decided, choose the 2 or 3 most realistic directions for this background and spread the programs across them.\n' +
    '3. If the country is decided, use only that country. If not, spread across at least 3 countries with no more than 3 programs from one country.\n' +
    '4. Respect the tuition limit if one is given. If you cannot confirm tuition, you may still include the program.\n' +
    '5. Never include these programs or any program from this list: ' + (exclude.length ? exclude.join(' | ') : 'none') + '.\n' +
    '6. Use only programs you confirmed on an official university page in this search. "official_url" must be the program page you found, starting with https://.\n' +
    '7. "reason" is ONE plain sentence of at most 28 words, explaining why this program fits THIS student, using their background or answers. Do not use labels like ambitious, target or safe.\n' +
    '8. "insight" is one or two sentences with a real, useful observation from your research for this student, for example about how many of these programs ask for a test, or a timing point.\n\n' +
    'Return only JSON in this exact shape:\n' +
    '{"insight":"...","programs":[{"university":"...","program":"...","country":"...","city":"...","reason":"...","official_url":"https://..."}]}';

  const { data, sources } = await generateJSON({ system, messages: [{ role: 'user', content: prompt }], search: true, temperature: 0.3, maxTokens: 8192, timeoutMs: 55000 });

  const list = Array.isArray(data) ? data : (data.programs || []);
  const seen = {};
  const programs = [];
  list.forEach(p => {
    if (!p || !p.university || !p.program) return;
    const id = slug(p.university + ' ' + p.program);
    if (!id || seen[id]) return;
    const key = (p.university + ' | ' + p.program).toLowerCase();
    if (exclude.some(x => x.toLowerCase() === key)) return;
    seen[id] = true;
    programs.push({
      id,
      university: str(p.university, 120),
      program: str(p.program, 160),
      country: str(p.country, 60),
      city: str(p.city, 80),
      reason: str(p.reason, 260),
      url: httpsUrl(p.official_url)
    });
  });
  if (!programs.length) { const e = new Error('Buddy could not find matching programs this time. Please try again.'); e.status = 502; throw e; }
  return { insight: str(data.insight, 400), programs: programs.slice(0, count), sources: sources.slice(0, 8) };
});
