'use strict';
// Gemini client. The key stays on the server.
// Primary: the Interactions API (https://aistudio.google.com/docs/get-started).
// Fallback: the older generateContent call, used only if the Interactions call is refused.

const INTERACTION_MODELS = ['gemini-4-hydrogen'];
const LEGACY_MODELS = ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
const API_REVISION = '2026-05-20';

function getKey() {
  var k = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || '';
  return String(k).trim().replace(/^["']|["']$/g, '').trim();
}
function base() { return process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'; }

function redact(text, key) {
  let t = String(text || '');
  if (key) t = t.split(key).join('***');
  return t.replace(/AIza[0-9A-Za-z_\-]{20,}/g, '***').replace(/AQ\.[0-9A-Za-z_\-\.]{20,}/g, '***');
}

async function post(url, headers, body, key, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'x-goog-api-key': key }, headers), body: JSON.stringify(body), signal: ctl.signal });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { /* keep raw */ }
    if (!res.ok) {
      const msg = (data && data.error && (data.error.message || JSON.stringify(data.error))) || raw.slice(0, 300);
      const err = new Error(redact(msg, key));
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Interactions API ----
function toInput(messages) {
  if (messages.length === 1) return messages[0].content;
  return messages.map(m => (m.role === 'assistant' ? 'Buddy: ' : 'Student: ') + m.content).join('\n\n') + '\n\nBuddy:';
}
function extractInteraction(data) {
  const steps = (data && data.steps) || [];
  let text = '';
  const sources = [];
  steps.forEach(st => {
    if (!st || st.type !== 'model_output') return;
    (Array.isArray(st.content) ? st.content : [{ text: st.content }]).forEach(b => {
      if (!b) return;
      if (typeof b.text === 'string') text += b.text;
      (b.annotations || []).forEach(a => { if (a && a.type === 'url_citation' && a.url) sources.push({ title: a.title || '', url: a.url }); });
    });
  });
  if (!text && data && typeof data.output_text === 'string') text = data.output_text;
  return { text: text.trim(), sources };
}
async function viaInteractions(model, opts, key) {
  const body = { model, input: toInput(opts.messages), generation_config: { max_output_tokens: opts.maxTokens || 8192 } };
  if (opts.system) body.system_instruction = opts.system;
  if (opts.search) body.tools = [{ type: 'google_search' }];
  const data = await post(base() + '/v1beta/interactions', { 'Api-Revision': API_REVISION }, body, key, opts.timeoutMs || 55000);
  if (data && data.status === 'failed') { const e = new Error('The model could not finish this request.'); e.status = 502; throw e; }
  return extractInteraction(data);
}

// ---- Older generateContent API (fallback) ----
function extractLegacy(data) {
  const cand = data && data.candidates && data.candidates[0];
  const parts = (cand && cand.content && cand.content.parts) || [];
  const text = parts.map(p => p.text || '').join('').trim();
  const chunks = (cand && cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || [];
  const sources = chunks.map(c => c.web && { title: c.web.title || '', url: c.web.uri || '' }).filter(Boolean);
  return { text, sources };
}
async function viaLegacy(model, opts, key) {
  const body = {
    contents: opts.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: opts.maxTokens || 8192 }
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.search) body.tools = [{ googleSearch: {} }];
  const data = await post(base() + '/v1beta/models/' + model + ':generateContent', {}, body, key, opts.timeoutMs || 55000);
  return extractLegacy(data);
}

// opts: { system, messages:[{role,content}], search:boolean, maxTokens, timeoutMs }
async function generate(opts) {
  const key = getKey();
  if (!key) { const e = new Error('The Gemini key is not set on the server.'); e.status = 500; throw e; }
  const forced = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : null;
  const attempts = [];
  (forced || INTERACTION_MODELS).forEach(m => attempts.push({ kind: 'i', model: m }));
  if (!forced) LEGACY_MODELS.forEach(m => attempts.push({ kind: 'l', model: m }));
  let lastErr = null, quota = false;
  for (const a of attempts) {
    try {
      const out = a.kind === 'i' ? await viaInteractions(a.model, opts, key) : await viaLegacy(a.model, opts, key);
      if (!out.text) { const e = new Error('The model returned no text.'); e.status = 502; throw e; }
      return out;
    } catch (e) {
      lastErr = e;
      if (e.status === 429) quota = true;
      if (e.name === 'AbortError') { const t = new Error('Research took too long. Please try again.'); t.status = 504; throw t; }
      if (e.status === 401 || e.status === 403) throw e;      // key problem: other models will not help
      continue;                                               // 400, 404, 429, 5xx, empty text: try the next option
    }
  }
  if (quota) { const q = new Error('Google says the quota for this key is used up. Wait a minute and try again, or turn on billing for the Google project.'); q.status = 429; throw q; }
  throw lastErr || new Error('No model answered.');
}

function parseJSON(text) {
  let t = String(text || '').trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch (e) { /* fall through */ }
  const a = t.search(/[\[{]/);
  if (a < 0) return null;
  const open = t[a], close = open === '{' ? '}' : ']';
  const b = t.lastIndexOf(close);
  if (b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

async function generateJSON(opts) {
  let out = await generate(opts);
  let data = parseJSON(out.text);
  if (data == null) {
    const retry = Object.assign({}, opts, { messages: opts.messages.concat([{ role: 'assistant', content: out.text.slice(0, 2000) }, { role: 'user', content: 'Return only the JSON value described above. No other text.' }]) });
    out = await generate(retry);
    data = parseJSON(out.text);
  }
  if (data == null) { const e = new Error('Buddy could not read the research result. Please try again.'); e.status = 502; throw e; }
  return { data, sources: out.sources };
}

module.exports = { getKey, generate, generateJSON, parseJSON, redact };
