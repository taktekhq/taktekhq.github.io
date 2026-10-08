import { runAudit } from "./run.js";
import { normalizeUrl } from "./audit.js";
import { cleanInput, runAiCheck, fold, modelsFor } from "./ai.js";

const ALLOWED = ["https://taktek.io", "https://www.taktek.io", "http://localhost:8123", "http://127.0.0.1:8123"];
const LIMIT_PER_HOUR = 12;       // audits per IP
const LIMIT_PER_DOMAIN = 6;      // audits per domain per hour (any IP): we are polite to the sites we fetch
const mem = new Map();           // per-isolate fallback when KV is not bound
const cache = new Map();         // 5 minute result cache, per isolate
const AI_LIMIT_PER_HOUR = 6;     // AI checks per IP (cache hits are free)
const AI_LIMIT_PER_BIZ = 3;      // fresh AI checks per business+city per hour, any IP
const AI_TTL = 86400;            // AI results cached 24 h per business+city+category
const EMAIL_RE = /^[^@\s]{1,100}@[^@\s]+\.[^@\s]{2,}$/;

function cors(req) {
  const o = req.headers.get("origin");
  return { "access-control-allow-origin": ALLOWED.includes(o) ? o : ALLOWED[0], "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", vary: "origin" };
}
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors(req) } });

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, "0")).join("");
}

// Counter keyed by the hour. The IP is hashed with a daily-rotating salt and is never logged or stored beyond the counter's 2 hour TTL.
async function hit(env, key, limit) {
  const hour = Math.floor(Date.now() / 3.6e6);
  const k = `rl:${key}:${hour}`;
  let n;
  if (env.KV) {
    n = parseInt(await env.KV.get(k) || "0", 10) + 1;
    if (n <= limit) await env.KV.put(k, String(n), { expirationTtl: 7200 });
  } else {
    n = (mem.get(k) || 0) + 1; mem.set(k, n);
    if (mem.size > 5000) mem.clear();
  }
  return n <= limit;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === "/" ) return json(req, { name: "taktek audit api", docs: "https://taktek.io/audit/" });

    if (url.pathname === "/api/audit" && (req.method === "GET" || req.method === "POST")) {
      let target = url.searchParams.get("url");
      if (req.method === "POST") { try { target = (await req.json()).url; } catch { /* fall through */ } }
      const u = normalizeUrl(target);
      if (!u) return json(req, { error: "bad_url" }, 400);
      const ip = req.headers.get("cf-connecting-ip") || "unknown";
      const day = Math.floor(Date.now() / 8.64e7);
      const ipKey = await sha(ip + ":" + day + ":" + (env.SALT || "taktek"));
      const host = u.hostname.replace(/^www\./, "");
      const cached = cache.get(host);
      if (cached && Date.now() - cached.t < 3e5) return json(req, cached.r);
      if (!(await hit(env, "ip:" + ipKey, LIMIT_PER_HOUR)) || !(await hit(env, "d:" + host, LIMIT_PER_DOMAIN))) return json(req, { error: "rate_limited" }, 429);
      const r = await runAudit(u.toString());
      if (!r.error) {
        cache.set(host, { t: Date.now(), r }); if (cache.size > 200) cache.clear();
        // The only thing we log: the domain and the score.
        console.log(JSON.stringify({ evt: "audit", domain: r.host, score: r.score }));
      }
      return json(req, r, r.error === "bad_url" ? 400 : 200);
    }

    // "Is ChatGPT recommending your business?" check (taktek.io/ai/). Cached 24 h per business+city+category.
    if (url.pathname === "/api/ai-check" && req.method === "GET") { // which models the page may name
      return json(req, { models: modelsFor(env).map(m => ({ id: m.id, label: m.label, model: m.model, web: m.web })) });
    }
    if (url.pathname === "/api/ai-check" && req.method === "POST") {
      let b; try { b = await req.json(); } catch { return json(req, { error: "bad_request" }, 400); }
      if (b.hp) return json(req, { error: "bad_request" }, 400); // honeypot
      const q = cleanInput(b);
      if (!q) return json(req, { error: "bad_input" }, 400);
      const key = "ai:v1:" + await sha(fold(q.name) + "|" + fold(q.city) + "|" + fold(q.category));
      // The weekly monitor re-runs subscribers' checks fresh, past the limits.
      const monitor = env.MONITOR_TOKEN && req.headers.get("authorization") === "Bearer " + env.MONITOR_TOKEN;
      if (!monitor && env.KV) {
        const hitc = await env.KV.get(key, "json");
        if (hitc) {
          console.log(JSON.stringify({ evt: "ai_check", cached: true, category: q.category, city: q.city, recommended: hitc.summary?.recommended }));
          return json(req, { ...hitc, cached: true, key: key.slice(6) });
        }
      }
      if (!monitor) {
        const ip = req.headers.get("cf-connecting-ip") || "unknown";
        const ipKey = await sha(ip + ":" + Math.floor(Date.now() / 8.64e7) + ":" + (env.SALT || "taktek"));
        if (!(await hit(env, "aiip:" + ipKey, AI_LIMIT_PER_HOUR)) || !(await hit(env, "aib:" + key.slice(6), AI_LIMIT_PER_BIZ))) return json(req, { error: "rate_limited" }, 429);
      }
      const r = await runAiCheck(q, env, { country: req.cf?.country || null });
      if (r.error) {
        console.log(JSON.stringify({ evt: "ai_check_error", error: r.error, detail: r.detail }));
        return json(req, { error: r.error === "no_models" ? "not_configured" : "upstream" }, 503);
      }
      if (env.KV) await env.KV.put(key, JSON.stringify(r), { expirationTtl: AI_TTL });
      // Anonymous log: what they typed about the business category/city, the outcome; no IP, no name.
      console.log(JSON.stringify({ evt: "ai_check", cached: false, monitor: !!monitor, category: q.category, city: q.city, recommended: r.summary.recommended, asked: r.summary.asked, known: r.summary.known, ms: r.ms, country: req.cf?.country || null }));
      return json(req, { ...r, cached: false, key: key.slice(6) });
    }

    // Opt-in: "email me the full report". Needs the consent flag; stored in KV for 180 days so a human can follow up.
    if (url.pathname === "/api/lead" && req.method === "POST") {
      let b; try { b = await req.json(); } catch { return json(req, { error: "bad_request" }, 400); }
      if (b.website) return json(req, { ok: true }); // honeypot
      if (b.source === "ai" || b.source === "ai_feedback" || b.source === "ai_monitor") { // taktek.io/ai/: report email, feedback box, monitor intent
        const ip1 = req.headers.get("cf-connecting-ip") || "unknown";
        if (!(await hit(env, "ailead:" + await sha(ip1 + ":" + Math.floor(Date.now() / 8.64e7)), 8))) return json(req, { error: "rate_limited" }, 429);
        const em = String(b.email || "").trim().slice(0, 200);
        const base = { business: String(b.name || "").slice(0, 80), city: String(b.city || "").slice(0, 60), category: String(b.category || "").slice(0, 60),
          website: String(b.site || "").slice(0, 200), key: String(b.key || "").replace(/[^a-f0-9]/g, "").slice(0, 16), lang: b.lang === "ar" ? "ar" : "en",
          country: req.cf?.country || null, at: new Date().toISOString() };
        let rec;
        if (b.source === "ai_feedback") {
          const text = String(b.text || "").trim().slice(0, 2000);
          if (!text) return json(req, { error: "bad_request" }, 400);
          rec = { kind: "ai_feedback", ...base, text, email: EMAIL_RE.test(em) ? em : null };
        } else if (b.source === "ai_monitor") {
          // Written before the Stripe redirect, so the paid subscription can be matched to the business by key (client_reference_id).
          if (!base.key) return json(req, { error: "bad_request" }, 400);
          rec = { kind: "ai_monitor_intent", ...base };
          if (env.KV) await env.KV.put(`intent:${base.key}`, JSON.stringify(rec), { expirationTtl: 30 * 86400 });
          console.log(JSON.stringify({ evt: "ai_monitor_intent" }));
          return json(req, { ok: true });
        } else {
          if (b.consent !== true || !EMAIL_RE.test(em)) return json(req, { error: "bad_request" }, 400);
          rec = { kind: "ai", ...base, email: em, recommended: Number(b.recommended) || 0, consent: "ticked 'email me the full AI report'" };
        }
        if (env.KV) await env.KV.put(`lead:${rec.kind}:${rec.at}`, JSON.stringify(rec), { expirationTtl: 180 * 86400 });
        console.log(JSON.stringify({ evt: rec.kind, country: rec.country }));
        return json(req, { ok: true });
      }
      if (b.source === "work") { // taktek.io/work package/audit request form
        const em = String(b.email || "").trim().slice(0, 200);
        const business = String(b.business || "").trim().slice(0, 160);
        const where = String(b.where || "").trim().slice(0, 300);
        if (!/^[^@\s]{1,100}@[^@\s]+\.[^@\s]{2,}$/.test(em) || !business || !where) return json(req, { error: "bad_request" }, 400);
        const ip0 = req.headers.get("cf-connecting-ip") || "unknown";
        if (!(await hit(env, "work:" + await sha(ip0 + ":" + Math.floor(Date.now() / 8.64e7)), 5))) return json(req, { error: "rate_limited" }, 429);
        const rec = { kind: "work", package: String(b.package || "Free audit").slice(0, 80), business, where, email: em,
          notes: String(b.notes || "").slice(0, 2000), country: req.cf?.country || null, at: new Date().toISOString() };
        if (env.KV) await env.KV.put(`lead:work:${rec.at}`, JSON.stringify(rec), { expirationTtl: 365 * 86400 });
        console.log(JSON.stringify({ evt: "work_request", package: rec.package, country: rec.country }));
        return json(req, { ok: true });
      }
      const email = String(b.email || "").trim().slice(0, 200);
      const u = normalizeUrl(b.url);
      if (b.consent !== true || !/^[^@\s]{1,100}@[^@\s]+\.[^@\s]{2,}$/.test(email) || !u) return json(req, { error: "bad_request" }, 400);
      const ip = req.headers.get("cf-connecting-ip") || "unknown";
      if (!(await hit(env, "lead:" + await sha(ip + ":" + Math.floor(Date.now() / 8.64e7)), 5))) return json(req, { error: "rate_limited" }, 429);
      const rec = { email, domain: u.hostname, business: String(b.business || "").slice(0, 120), city: String(b.city || "").slice(0, 80), score: Number(b.score) || null, lang: b.lang === "ar" ? "ar" : "en", consent: "ticked 'email me the full report'", at: new Date().toISOString() };
      if (env.KV) await env.KV.put(`lead:${rec.at}:${rec.domain}`, JSON.stringify(rec), { expirationTtl: 180 * 86400 });
      console.log(JSON.stringify({ evt: "lead", domain: rec.domain, score: rec.score }));
      return json(req, { ok: true });
    }
    return json(req, { error: "not_found" }, 404);
  },
};
