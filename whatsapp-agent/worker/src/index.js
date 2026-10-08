// Cloudflare Worker behind taktek.io/whatsapp-agent/. POST /chat -> one assistant reply.
// Stateless: the browser sends the conversation state and the demo bookings with every message;
// nothing is stored and message text is never logged. Scripted engine first; Workers AI only
// answers messages the engine has no intent for (and only if the AI binding exists).
import { reply, aiSystemPrompt, BIZ, initState } from './engine.js';

const ORIGINS = ['https://taktek.io', 'https://www.taktek.io', 'http://localhost:8000', 'http://localhost:8080', 'http://127.0.0.1:8000'];
const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MAX_TEXT = 300;
const mem = new Map(); // fallback limiter (per isolate) when the ratelimit binding is absent

const cors = (req) => {
  const o = req.headers.get('Origin');
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
};
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(req) } });

async function limited(env, ip) {
  if (env.RL) { const { success } = await env.RL.limit({ key: ip }); return !success; }
  const now = Date.now(); const hits = (mem.get(ip) || []).filter((t) => now - t < 60000);
  hits.push(now); mem.set(ip, hits);
  if (mem.size > 5000) mem.clear();
  return hits.length > 20;
}

const okDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
function cleanBookings(b) {
  if (!Array.isArray(b)) return [];
  return b.slice(0, 5).filter((x) => x && okDate(x.date) && Number.isInteger(x.time)).map((x) => ({ id: String(x.id || '').slice(0, 12), service: String(x.service || '').slice(0, 20), date: x.date, time: x.time }));
}
function cleanState(s) {
  const base = initState(s?.biz === 'salon' ? 'salon' : 'clinic', ['en', 'fr', 'ar'].includes(s?.lang) ? s.lang : 'en');
  const pend = ['service', 'when', 'resched', 'confirm', null];
  return { ...base, pending: pend.includes(s?.pending) ? s.pending : null, service: BIZ[base.biz].services.some((x) => x.id === s?.service) ? s.service : null,
    date: okDate(s?.date) ? s.date : null, time: Number.isInteger(s?.time) ? s.time : null, handedOver: !!s?.handedOver, resched: !!s?.resched };
}
function serverToday() { const d = new Date(Date.now() + 3 * 3600e3); return d.toISOString().slice(0, 10); } // Beirut-ish

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/health') return json(req, { ok: true, ai: !!env.AI });
    if (url.pathname !== '/chat' || req.method !== 'POST') return json(req, { error: 'not found' }, 404);

    const ip = req.headers.get('CF-Connecting-IP') || 'local';
    if (await limited(env, ip)) return json(req, { error: 'rate_limited' }, 429);

    let body;
    try { body = await req.json(); } catch { return json(req, { error: 'bad json' }, 400); }
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : '';
    if (!text) return json(req, { error: 'empty' }, 400);
    const state = cleanState(body.state);
    const bookings = cleanBookings(body.bookings);
    // trust the visitor's local date only within a day of ours (their timezone), else use ours
    const t = okDate(body.today) && Math.abs(Date.parse(body.today) - Date.parse(serverToday())) <= 2 * 86400e3 ? body.today : serverToday();

    const r = reply({ text, state, bookings, today: t });
    r.source = 'script';
    if (r.intent === 'unknown' && env.AI) {
      try {
        const ai = await env.AI.run(MODEL, { messages: [{ role: 'system', content: aiSystemPrompt(state.biz, r.state.lang) }, { role: 'user', content: text }], max_tokens: 160, temperature: 0.3 });
        const out = (ai?.response || '').trim().slice(0, 500);
        if (out) { r.text = out; r.source = 'ai'; r.intent = 'ai'; }
      } catch { /* scripted answer stays */ }
    }
    return json(req, r);
  },
};
