// "Is ChatGPT recommending your business?" check: asks real assistants the questions customers ask,
// then reports honestly whether the business was named, the exact answers, the competitors named, and 3 fixes.
// Models: Gemini (flash tier, Google Search grounding) when GEMINI_API_KEY is set; Claude Haiku (web search)
// when ANTHROPIC_API_KEY is set. Never ChatGPT: we only name models we actually asked.
import { runAudit } from "./run.js";
import { normalizeUrl } from "./audit.js";

const BUDGET_MS = 20000;

export function cleanInput(b) {
  const s = (v, n) => String(v || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  const q = { name: s(b.name, 80), city: s(b.city, 60), category: s(b.category, 60), website: s(b.website, 200), lang: b.lang === "ar" ? "ar" : "en" };
  if (q.name.length < 2 || q.city.length < 2 || q.category.length < 2) return null;
  if (q.website && !normalizeUrl(q.website)) q.website = "";
  return q;
}

export function questions(q) {
  return [
    { id: "best", text: `What are the best ${q.category} in ${q.city}? Give me a short list with names.` },
    { id: "call", text: `Who should I call for ${q.category} in ${q.city}? Recommend a few specific businesses.` },
    { id: "know", text: `What do you know about ${q.name} in ${q.city}?` },
  ];
}

const SYSTEM = "Answer the way you would answer a normal customer. Be concise (under 120 words). Name specific businesses when you can. If you don't know a business, say so plainly.";

export function modelsFor(env) {
  const m = [];
  if (env.GEMINI_API_KEY) m.push({ id: "gemini", model: env.GEMINI_MODEL || "gemini-3.5-flash", label: "Google Gemini", web: env.GEMINI_GROUNDING !== "0" });
  if (env.ANTHROPIC_API_KEY) m.push({ id: "claude", model: env.CLAUDE_MODEL || "claude-haiku-5-5", label: "Anthropic Claude", web: env.CLAUDE_WEB !== "0" });
  return m;
}

async function withTimeout(ms, fn) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fn(ac.signal); } finally { clearTimeout(t); }
}

async function askGemini(env, m, prompt, signal, fetchImpl) {
  const body = { systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 400, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } } };
  // Thinking off: with it on, the thoughts used up the 400-token budget and the answer came back empty (Oct 2026).
  if (m.web) body.tools = [{ google_search: {} }];
  const r = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${m.model}:generateContent`, {
    method: "POST", signal, headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("gemini_" + r.status);
  const j = await r.json();
  const parts = j.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || "").join("").trim();
}

async function askClaude(env, m, prompt, signal, fetchImpl) {
  const body = { model: m.model, max_tokens: 700, system: SYSTEM, thinking: { type: "disabled" }, output_config: { effort: "low" }, messages: [{ role: "user", content: prompt }] };
  if (m.web) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 1 }];
  const r = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST", signal, headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("claude_" + r.status);
  const j = await r.json();
  if (j.stop_reason === "refusal") throw new Error("claude_refusal");
  return (j.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
}

// --- matching ------------------------------------------------------------------
const STOP = new Set(["the", "and", "of", "&", "sal", "sarl", "llc", "ltd", "inc", "co", "company", "group", "restaurant", "cafe", "café", "shop", "store", "clinic", "center", "centre", "salon", "hotel", "bakery", "al", "el", "le", "la", "les", "de", "du", "lebanon", "beirut"]);
export function fold(s) {
  return String(s || "").normalize("NFKD").replace(/[̀-ًͯ-ْ]/g, "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
}
// Tokens that identify the business (drop generic words); fall back to all tokens if nothing distinctive is left.
function keyTokens(name) {
  const all = fold(name).split(" ").filter(Boolean);
  const k = all.filter(t => !STOP.has(t) && t.length > 1);
  return k.length ? k : all;
}
export function mentions(text, name) {
  const t = " " + fold(text) + " ";
  const full = fold(name);
  if (full && t.includes(" " + full + " ")) return true;
  const k = keyTokens(name);
  if (!k.length) return false;
  // All distinctive tokens must appear, close together (within 40 chars of the first one).
  for (let i = t.indexOf(" " + k[0] + " "); i >= 0; i = t.indexOf(" " + k[0] + " ", i + 1)) {
    const win = t.slice(Math.max(0, i - 40), i + k[0].length + 60);
    if (k.every(x => win.includes(" " + x + " "))) return true;
  }
  return false;
}
const UNKNOWN_RE = /(don'?t have (any |specific |enough |reliable |detailed )*(information|details|data)|no (specific |reliable )?information|not (familiar|aware)|couldn'?t find|could not find|unable to find|can'?t find|no (results|records)|not able to (find|verify)|i'?m not sure)/i;

// Business names a model listed: list items and bold spans, cut at the first separator.
export function extractNames(text) {
  const out = [];
  const push = (s) => {
    s = s.replace(/\*\*|__|\[|\]\([^)]*\)/g, "").replace(/^[\s\d.)#*•-]+/, "").split(/\s[–—:-]\s|:\s|\s\(|,\s(?=located|in |on |at )/)[0].trim().replace(/[.:,;]+$/, "");
    if (s.length >= 3 && s.length <= 60 && s.split(" ").length <= 7 && !/^(best|top|here|note|tip|some|also|you|if|for|they|it|this|these|call|contact)\b/i.test(s)) out.push(s);
  };
  for (const line of String(text).split(/\n+/)) {
    const m = line.match(/^\s*(?:\d+[.)]|[-*•])\s+(.+)/);
    if (m) { const b = m[1].match(/\*\*([^*]+)\*\*/); push(b ? b[1] : m[1]); continue; }
    for (const b of line.matchAll(/\*\*([^*]{3,60})\*\*/g)) push(b[1]);
  }
  const seen = new Set();
  return out.filter(n => { const k = fold(n); if (!k || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);
}

// --- fixes -------------------------------------------------------------------------
// Picks 3 fix ids. Website-check failures come first (they are concrete and verified); AI-specific ones fill the rest.
export function pickFixes({ audit, website, mentionedBest, known, country }) {
  const fixes = [];
  const add = (id) => { if (!fixes.includes(id) && fixes.length < 3) fixes.push(id); };
  if (!website) add("website");
  if (audit && !audit.error) {
    for (const id of audit.fixes || []) if (["indexable", "schema", "ai", "maps"].includes(id)) add(id);
  }
  if (!mentionedBest) add("gbp");
  if (!known) add("directories");
  add("reviews");
  add("facts");
  if (country === "LB" && fixes.length < 3) add("directories");
  return fixes.slice(0, 3);
}

// Never throws.
export async function runAiCheck(q, env, { fetchImpl = fetch, country = null } = {}) {
  const models = modelsFor(env);
  if (!models.length) return { error: "no_models" };
  const t0 = Date.now();
  const qs = questions(q);
  const auditP = q.website ? Promise.race([runAudit(q.website, fetchImpl), new Promise(r => setTimeout(() => r({ error: "timeout" }), 12000))]) : Promise.resolve(null);
  const jobs = [];
  for (const m of models) for (const x of qs) {
    jobs.push(withTimeout(BUDGET_MS - 1500, (signal) => (m.id === "gemini" ? askGemini : askClaude)(env, m, x.text, signal, fetchImpl))
      .then(text => ({ model: m.id, q: x.id, text }))
      .catch(e => ({ model: m.id, q: x.id, error: e && e.name === "AbortError" ? "timeout" : String(e.message || e).slice(0, 40) })));
  }
  const [answers, audit] = await Promise.all([Promise.all(jobs), auditP]);

  const counts = new Map();
  const rows = answers.map(a => {
    if (a.error) return a;
    const mentioned = mentions(a.text, q.name);
    const names = a.q === "know" ? [] : extractNames(a.text).filter(n => !mentions(n, q.name));
    for (const n of names) { const k = fold(n); const c = counts.get(k) || { name: n, n: 0 }; c.n++; counts.set(k, c); }
    const unknown = a.q === "know" && (!mentioned || UNKNOWN_RE.test(a.text.slice(0, 400)));
    return { ...a, text: a.text.slice(0, 2500), mentioned: a.q === "know" ? !unknown : mentioned, competitors: names.slice(0, 6) };
  });
  const ok = rows.filter(r => !r.error);
  if (!ok.length) return { error: "models_failed", detail: rows.map(r => r.error) };
  const recRows = ok.filter(r => r.q !== "know");
  const mentionedBest = recRows.some(r => r.mentioned);
  const known = ok.some(r => r.q === "know" && r.mentioned);
  const competitors = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  return {
    ok: true,
    query: { name: q.name, city: q.city, category: q.category, website: q.website || null },
    checkedAt: new Date().toISOString(),
    ms: Date.now() - t0,
    models: models.map(m => ({ id: m.id, label: m.label, model: m.model, web: m.web })),
    questions: qs,
    answers: rows,
    summary: { recommended: recRows.filter(r => r.mentioned).length, asked: recRows.length, known },
    competitors,
    audit: audit && !audit.error ? { score: audit.score, host: audit.host, fixes: audit.fixes, checks: audit.checks.filter(c => audit.fixes.includes(c.id)) } : (audit ? { error: audit.error } : null),
    fixes: pickFixes({ audit, website: q.website, mentionedBest, known, country }),
  };
}
