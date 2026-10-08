import { runAudit } from "./run.js";
import { normalizeUrl } from "./audit.js";

const ALLOWED = ["https://taktek.io", "https://www.taktek.io", "http://localhost:8123", "http://127.0.0.1:8123"];
const LIMIT_PER_HOUR = 12;       // audits per IP
const LIMIT_PER_DOMAIN = 6;      // audits per domain per hour (any IP): we are polite to the sites we fetch
const mem = new Map();           // per-isolate fallback when KV is not bound
const cache = new Map();         // 5 minute result cache, per isolate

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

    // Opt-in: "email me the full report". Needs the consent flag; stored in KV for 180 days so a human can follow up.
    if (url.pathname === "/api/lead" && req.method === "POST") {
      let b; try { b = await req.json(); } catch { return json(req, { error: "bad_request" }, 400); }
      if (b.website) return json(req, { ok: true }); // honeypot
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
