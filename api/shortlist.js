'use strict';
const { generateJSON } = require('./_lib/gemini');
const { route, str, slug, httpsUrl, profileText, profileOf, SAFETY, STYLE } = require('./_lib/common');

const CACHE = new Map();
const TTL = 6 * 3600 * 1000;

module.exports = route(async function (body, req, spend) {
  const profile = profileOf(body.profile);
  const count = Math.min(Math.max(parseInt(body.count, 10) || 6, 2), 6);
  const theme = ['fit', 'notest', 'explore'].indexOf(body.theme) >= 0 ? body.theme : 'fit';
  const THEMES = {
    fit: 'Pick the programs that best match this student\'s background, course and marks.',
    notest: 'Pick only programs that do not require an entrance test such as GRE, GMAT or LSAT, or where it is clearly optional or waived, as stated on the official page. Skip any program where you cannot confirm this.',
    explore: 'Pick programs that widen the student\'s view: closely related courses they may not have considered, or the same course in a country they have not named. Keep every program realistic for their background.'
  };
  const exclude = (Array.isArray(body.exclude) ? body.exclude : []).slice(0, 40).map(x => str(x, 160));

  const ckey = JSON.stringify([profile, theme, count, exclude]);
  const hit = CACHE.get(ckey);
  if (hit && Date.now() - hit.t < TTL) return hit.v;

  spend();
  const system =
    'You are Buddy, a careful study abroad advisor for Indian students applying to postgraduate programs. ' +
    'Suggest only real postgraduate programs that you are confident exist and are currently offered. Never invent a program. ' +
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
    '6. Only include programs you are sure exist. Do not state fees, deadlines or test scores. "official_url" is the university\'s own page for the program if you are sure of it, otherwise an empty string.\n' +
    '7. "reason" is ONE plain sentence of at most 28 words, explaining why this program fits THIS student, using their background or answers. Do not use labels like ambitious, target or safe.\n' +
    '8. "insight" is one short sentence with a useful observation for this student, or an empty string.\n\n' +
    'Return only JSON in this exact shape:\n' +
    '{"insight":"...","programs":[{"university":"...","program":"...","country":"...","city":"...","reason":"...","official_url":"https://..."}]}';

  const { data, sources } = await generateJSON({ system, messages: [{ role: 'user', content: prompt }], search: false, maxTokens: 900, timeoutMs: 25000 });

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
  const result = { insight: str(data.insight, 300), programs: programs.slice(0, count), sources: [] };
  if (CACHE.size > 300) CACHE.clear();
  CACHE.set(ckey, { t: Date.now(), v: result });
  return result;
});
