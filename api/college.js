'use strict';
const { generateJSON } = require('./_lib/gemini');
const { route, str, httpsUrl, SAFETY, STYLE } = require('./_lib/common');

const CACHE = new Map();
const TTL = 7 * 24 * 3600 * 1000;
const KINDS = ['sop', 'resume', 'transcripts', 'lor', 'tests', 'form', 'fee', 'other'];

function nn(v, max) { const s = str(v, max || 400); return s && !/^(null|n\/a|not stated|unknown)$/i.test(s) ? s : null; }

module.exports = route(async function (body, req, spend) {
  const university = str(body.university, 120), program = str(body.program, 160), url = httpsUrl(body.url);
  if (!university || !program) { const e = new Error('Missing college or program.'); e.status = 400; throw e; }
  const ckey = (university + '|' + program).toLowerCase();
  const hit = CACHE.get(ckey);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  spend();

  const system =
    'You are Buddy, a careful study abroad advisor. Use Google Search and read the official university pages for the program. ' +
    'Never guess. If a fact is not stated on an official page, return null for it. ' + SAFETY + STYLE;

  const prompt =
    'PROGRAM: ' + program + ' at ' + university + (url ? '\nOfficial page found earlier: ' + url : '') + '\n\n' +
    'TASK: Collect the application facts for the next intake, from official pages only.\n' +
    'Also build the application checklist: every document or step a student must complete, in the order they would do it, at most 8 items. ' +
    'Each item has a short "title", a "kind" and a "note" with the exact requirement from the official page (for example a word limit or the number of letters). ' +
    'Allowed kinds: sop (the single main statement of purpose or personal statement, use this kind once only), resume, transcripts, lor (recommendation letters), tests (entrance or English tests), form (online application form), fee (application fee), other (anything else, including extra essays, portfolios, writing samples or interviews).\n\n' +
    'Return only JSON in this exact shape (use null when not stated):\n' +
    '{"found":true or false (false if you could not find this exact program on an official university page),"deadline":"text with the year if stated","cycle":"intake name","duration":"text","entrance_tests":"which entrance test is required or optional, such as GRE, GMAT or LSAT, and the policy","english_test":"accepted tests and minimum scores","academic_requirement":"minimum grade or degree needed","sop_requirement":"prompt, word or page limit","lor_count":number or null,"application_fee":"amount with currency","tuition":"amount with currency and what period it covers","documents":["..."],"checklist":[{"title":"...","kind":"sop","note":"..."}],"highlights":"one sentence on what the program offers, from the official page","sources":[{"title":"...","url":"https://..."}]}';

  const { data, sources } = await generateJSON({ system, messages: [{ role: 'user', content: prompt }], search: true, maxTokens: 1500, timeoutMs: 55000 });

  let hasSop = false;
  const checklist = (Array.isArray(data.checklist) ? data.checklist : []).slice(0, 8).map(c => {
    let kind = KINDS.indexOf(c && c.kind) >= 0 ? c.kind : 'other';
    if (kind === 'sop') { if (hasSop) kind = 'other'; hasSop = true; }
    return { title: str(c && c.title, 100), kind, note: nn(c && c.note, 300) };
  }).filter(c => c.title);

  const srcs = (Array.isArray(data.sources) ? data.sources : []).map(s => ({ title: str(s && s.title, 100), url: httpsUrl(s && s.url) })).filter(s => s.url);
  sources.forEach(s => { const u = httpsUrl(s.url); if (u && !srcs.some(x => x.url === u)) srcs.push({ title: str(s.title, 100), url: u }); });

  const result = {
    deadline: nn(data.deadline, 200), cycle: nn(data.cycle, 80), duration: nn(data.duration, 80),
    entrance_tests: nn(data.entrance_tests, 300), english_test: nn(data.english_test, 300), academic_requirement: nn(data.academic_requirement, 300),
    sop_requirement: nn(data.sop_requirement, 300),
    lor_count: (typeof data.lor_count === 'number' && isFinite(data.lor_count)) ? data.lor_count : null,
    application_fee: nn(data.application_fee, 100), tuition: nn(data.tuition, 200),
    documents: (Array.isArray(data.documents) ? data.documents : []).slice(0, 12).map(d => str(d, 120)).filter(Boolean),
    found: data.found !== false, checklist, highlights: nn(data.highlights, 300),
    sources: srcs.slice(0, 6), checked: new Date().toISOString().slice(0, 10)
  };
  if (result.found) { if (CACHE.size > 300) CACHE.clear(); CACHE.set(ckey, { t: Date.now(), v: result }); }
  return result;
});
