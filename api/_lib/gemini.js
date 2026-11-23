'use strict';
// Thin client for the Gemini API. The key stays on the server (process.env.GEMINI_API_KEY).
// Supports both key types: AI Studio keys (AIza...) and Vertex express keys (AQ...).

const KNOWN_MODELS = ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
let workingModel = null;
let workingProvider = null;

function getKey() {
  var k = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || '';
  return String(k).trim().replace(/^["']|["']$/g, '').trim();
}

function baseStudio() { return process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'; }
function baseVertex() { return process.env.GEMINI_VERTEX_BASE_URL || process.env.GEMINI_BASE_URL || 'https://aiplatform.googleapis.com'; }

function redact(text, key) {
  let t = String(text || '');
  if (key) t = t.split(key).join('***');
  return t.replace(/AIza[0-9A-Za-z_\-]{20,}/g, '***').replace(/AQ\.[0-9A-Za-z_\-\.]{20,}/g, '***');
}

function providersFor(key) {
  if (workingProvider) return [workingProvider];
  if (/^AIza/.test(key)) return ['studio'];
  return ['vertex', 'studio'];
}

function urlFor(provider, model, key) {
  if (provider === 'vertex') return baseVertex() + '/v1/publishers/google/models/' + model + ':generateContent?key=' + encodeURIComponent(key);
  return baseStudio() + '/v1beta/models/' + model + ':generateContent';
}

async function post(provider, model, key, body, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'studio') headers['x-goog-api-key'] = key;
    const res = await fetch(urlFor(provider, model, key), { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { /* keep raw */ }
    if (!res.ok) {
      const msg = (data && data.error && data.error.message) || raw.slice(0, 300);
      const err = new Error(redact(msg, key));
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function extract(data) {
  const cand = data && data.candidates && data.candidates[0];
  const parts = (cand && cand.content && cand.content.parts) || [];
  const text = parts.map(p => p.text || '').join('').trim();
  const chunks = (cand && cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || [];
  const sources = chunks.map(c => c.web && { title: c.web.title || '', url: c.web.uri || '' }).filter(Boolean);
  return { text, sources, finish: cand && cand.finishReason };
}

// opts: { system, messages:[{role,content}], search:boolean, json:boolean, temperature, maxTokens, timeoutMs }
async function generate(opts) {
  const key = getKey();
  if (!key) { const e = new Error('The Gemini key is not set on the server.'); e.status = 500; throw e; }
  const body = {
    contents: opts.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { temperature: opts.temperature == null ? 0.4 : opts.temperature, maxOutputTokens: opts.maxTokens || 8192 }
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.search) body.tools = [{ googleSearch: {} }];
  else if (opts.json) body.generationConfig.responseMimeType = 'application/json';

  const order = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : [workingModel].concat(KNOWN_MODELS);
  const models = order.filter(function (m, i) { return m && order.indexOf(m) === i; });
  let lastErr = null;
  for (const provider of providersFor(key)) {
    for (const model of models) {
      try {
        const data = await post(provider, model, key, body, opts.timeoutMs || 55000);
        const out = extract(data);
        if (!out.text) { const e = new Error('The model returned no text.'); e.status = 502; throw e; }
        workingModel = model; workingProvider = provider;
        return out;
      } catch (e) {
        lastErr = e;
        // 404 means this model name is not available: try the next one. 401/403/400 on a provider: try the other provider.
        if (e.status === 404 || e.status === 429 || e.status === 503) continue;
        if (e.status === 400 || e.status === 401 || e.status === 403) break;
        if (e.name === 'AbortError') { const t = new Error('Research took too long. Please try again.'); t.status = 504; throw t; }
        throw e;
      }
    }
  }
  if (lastErr && lastErr.status === 429) { const q = new Error('Google says the free quota for this key is used up. Wait a minute and try again, or turn on billing for the Google project.'); q.status = 429; throw q; }
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
