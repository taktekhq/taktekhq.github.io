import { UA, normalizeUrl, parseRobots, robotsAllows, evaluate } from "./audit.js";

const MAX_BYTES = 400 * 1024;

async function get(url, { timeout, fetchImpl, maxBytes = MAX_BYTES }) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  const t0 = Date.now();
  try {
    const res = await fetchImpl(url, { signal: ac.signal, redirect: "follow", headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,text/plain,*/*;q=0.5", "accept-language": "en,ar;q=0.5" } });
    const reader = res.body.getReader();
    const chunks = []; let bytes = 0, truncated = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); bytes += value.length;
      if (bytes >= maxBytes) { truncated = true; try { await reader.cancel(); } catch { /* ignore */ } break; }
    }
    const buf = new Uint8Array(bytes); let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; }
    const headers = {}; res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    return { ok: true, status: res.status, url: new URL(res.url || url), headers, text: new TextDecoder("utf-8", { fatal: false }).decode(buf), bytes, truncated, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, error: e && e.name === "AbortError" ? "timeout" : "network", ms: Date.now() - t0 };
  } finally { clearTimeout(timer); }
}

// Never throws. One page + robots.txt + sitemap, nothing else.
export async function runAudit(input, fetchImpl = fetch) {
  const u = normalizeUrl(input);
  if (!u) return { error: "bad_url" };
  const origin = u.origin;
  const rob = await get(origin + "/robots.txt", { timeout: 4000, fetchImpl, maxBytes: 200 * 1024 });
  const robotsText = rob.ok && rob.status === 200 && !/<html/i.test(rob.text.slice(0, 500)) ? rob.text : "";
  const robots = parseRobots(robotsText);
  const blockedByRobots = robotsText && !robotsAllows(robots, "TaktekAuditBot", u.pathname || "/");
  if (blockedByRobots) {
    return { ...evaluate({ finalUrl: u, status: 0, headers: {}, html: "", ms: 0, bytes: 0, robotsText, robotsStatus: 200, sitemapOk: false, blockedByRobots: true }), ok: true };
  }
  const smUrl = (robots.sitemaps[0] && /^https?:\/\//i.test(robots.sitemaps[0])) ? robots.sitemaps[0] : origin + "/sitemap.xml";
  const [page, sm] = await Promise.all([
    get(u.toString(), { timeout: 8000, fetchImpl }),
    get(smUrl, { timeout: 4000, fetchImpl, maxBytes: 4096 }),
  ]);
  if (!page.ok) return { error: page.error === "timeout" ? "timeout" : "unreachable", host: u.hostname };
  const sitemapOk = sm.ok && sm.status === 200 && /<(urlset|sitemapindex)\b/i.test(sm.text);
  const r = evaluate({
    finalUrl: page.url, status: page.status, headers: page.headers, html: page.text, ms: page.ms, bytes: page.bytes, truncated: page.truncated,
    robotsText, robotsStatus: rob.ok ? rob.status : 0, sitemapOk,
  });
  return { ...r, ok: true, botWall: page.status === 403 || page.status === 429 || page.status === 503 };
}
