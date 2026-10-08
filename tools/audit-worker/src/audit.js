// Pure audit logic: takes fetched pieces, returns language-neutral check results.
// Ported from github.com/taktekhq/leadscout (audit.py), extended with indexability,
// robots/sitemap and AI-crawler checks.

export const UA = "TaktekAuditBot/1.0 (+https://taktek.io/audit/; free website visibility check requested by the site owner)";
const BOT = "taktekauditbot";

const WA_RE = /(wa\.me\/|wa\.link\/|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:\/\/|joinchat|click-to-chat|(?:href|src|data-[a-z-]+|onclick)\s*=\s*["'][^"']*whatsapp)/i;
const MAPS_RE = /(google\.[a-z.]+\/maps|maps\.google\.|maps\.googleapis\.com|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page\/|google\.com\/maps\/embed)/i;
const BOOK_RE = /(calendly\.com|book\.?now|book[- ](an?|your|online|appointment|a )|appointment|reserve|reservation|r\u00e9server|\u062d\u062c\u0632|booking|fresha\.com|setmore\.com|acuityscheduling\.com|squareup\.com\/appointments|simplybook\.me|vagaro\.com|opentable\.|resy\.com|booksy\.com|treatwell)/i;
const LOCAL_STRICT = /^(LocalBusiness)$|Dentist|MedicalClinic|Physician|BeautySalon|HairSalon|HealthAndBeautyBusiness|DaySpa|^Spa$|ExerciseGym|RealEstateAgent|Restaurant|FoodEstablishment|CafeOrCoffeeShop|Bakery|BarOrPub|Hotel|LodgingBusiness|^Store$|AutoRepair|LegalService|Attorney|AccountingService|ProfessionalService|HomeAndConstructionBusiness|Pharmacy|TravelAgency|Hospital|MedicalBusiness|Store$/;
const PARKED = ["domain is for sale", "this domain is parked", "buy this domain", "domain may be for sale", "godaddy.com/domains", "this web page is parked", "under maintenance", "coming soon"];
const AI_BOTS = ["gptbot", "oai-searchbot", "chatgpt-user", "perplexitybot", "claudebot", "google-extended"];

export function normalizeUrl(input) {
  let s = String(input || "").trim();
  if (!s || s.length > 300) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  if (u.port && u.port !== "80" && u.port !== "443") return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return null;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return null; // IP literals
  if (!/^[a-z0-9.\u00a1-\uffff-]+$/i.test(h)) return null;
  return u;
}

// --- robots.txt -------------------------------------------------------------
export function parseRobots(text) {
  const groups = []; let cur = null; let lastWasUA = false; const sitemaps = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") {
      if (!cur || !lastWasUA) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase()); lastWasUA = true;
    } else {
      lastWasUA = false;
      if (k === "sitemap") sitemaps.push(v);
      else if (cur && (k === "disallow" || k === "allow")) cur.rules.push({ allow: k === "allow", path: v });
    }
  }
  return { groups, sitemaps };
}

function ruleMatch(path, rule) {
  if (rule === "") return -1;
  const re = new RegExp("^" + rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
  return re.test(path) ? rule.length : -1;
}

// Can `agent` fetch `path`? Longest matching rule wins, allow wins ties.
export function robotsAllows(robots, agent, path = "/") {
  agent = agent.toLowerCase();
  let g = robots.groups.filter(x => x.agents.some(a => a !== "*" && agent.includes(a)));
  if (!g.length) g = robots.groups.filter(x => x.agents.includes("*"));
  let best = -1, allow = true;
  for (const grp of g) for (const r of grp.rules) {
    const len = ruleMatch(path, r.path);
    if (len > best || (len === best && r.allow)) { best = len; allow = r.allow; }
  }
  return allow;
}

// --- HTML ---------------------------------------------------------------------
function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
}
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&(middot|bull);/g, "·").replace(/&(ndash|mdash);/g, "–").replace(/&(rsquo|lsquo);/g, "'").replace(/&(raquo|laquo);/g, "»").replace(/&copy;/g, "©").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/\s+/g, " ").trim();
}

export function parseHtml(html) {
  const out = { title: "", description: "", viewport: false, lang: "", noindex: false, canonical: "", h1: false, jsonld: [], localBusiness: false, visibleChars: 0, ogImage: false };
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) out.title = decode(t[1]);
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0], name = (attr(tag, "name") || attr(tag, "property")).toLowerCase(), c = attr(tag, "content");
    if (name === "description") out.description = decode(c);
    else if (name === "viewport") out.viewport = true;
    else if (name === "robots" || name === "googlebot") { if (/noindex/i.test(c)) out.noindex = true; }
    else if (name === "og:image") out.ogImage = !!c;
  }
  const lang = html.match(/<html\b[^>]*>/i); if (lang) out.lang = attr(lang[0], "lang").toLowerCase();
  const can = html.match(/<link\b[^>]*rel\s*=\s*["']?canonical[^>]*>/i); if (can) out.canonical = attr(can[0], "href");
  out.h1 = /<h1[\s>]/i.test(html);
  for (const m of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.jsonld.push(JSON.parse(m[1].trim())); } catch { /* ignore */ }
  }
  const types = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    const ty = n["@type"]; (Array.isArray(ty) ? ty : [ty]).forEach(x => x && types.push(String(x)));
    if (n["@graph"]) walk(n["@graph"]);
    for (const k of ["mainEntity", "about", "publisher", "provider", "author"]) if (n[k]) walk(n[k]);
  };
  out.jsonld.forEach(walk);
  out.schemaTypes = [...new Set(types)].slice(0, 8);
  out.localBusiness = types.some(x => LOCAL_STRICT.test(x));
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<!--[\s\S]*?-->/gi, " ").replace(/<[^>]+>/g, " ");
  out.visibleChars = decode(body).length;
  return out;
}

// status: "pass" | "warn" | "fail" ; weight = points at stake
function chk(id, status, weight, data = {}) { return { id, status, weight, ...data }; }

export function evaluate({ finalUrl, status, headers, html, ms, bytes, robotsText, robotsStatus, sitemapOk, sitemapUrls, blockedByRobots, truncated }) {
  const checks = [];
  const https = finalUrl.protocol === "https:";
  checks.push(chk("https", https ? "pass" : "fail", 10));

  const robots = parseRobots(robotsText || "");
  const xrobots = (headers["x-robots-tag"] || "").toLowerCase();
  const botBlocked = !!blockedByRobots;

  if (botBlocked) {
    // We stopped before reading the page, as robots.txt asked.
    checks.push(chk("indexable", "warn", 12, { note: "robots" }));
    return finish(checks, { finalUrl, status, blocked: true, robots, robotsStatus, sitemapOk });
  }

  const p = parseHtml(html || "");
  const lower = (html || "").toLowerCase();
  const parked = status < 400 && ((html || "").length < 300 || PARKED.some(x => p.title.toLowerCase().includes(x) || (p.visibleChars < 600 && lower.includes(x))));

  checks.push(chk("mobile", p.viewport ? "pass" : "fail", 10));

  // Speed: server + download time for the HTML, and its weight.
  const kb = Math.round(bytes / 1024);
  let speed = "pass";
  if (ms > 3500 || kb > 3000) speed = "fail"; else if (ms > 1500 || kb > 1000) speed = "warn";
  checks.push(chk("speed", speed, 10, { ms: Math.round(ms), kb, truncated: !!truncated }));

  const tl = p.title.length;
  checks.push(chk("title", !tl ? "fail" : (tl < 10 || tl > 70) ? "warn" : "pass", 8, { value: p.title.slice(0, 120), len: tl }));
  const dl = p.description.length;
  checks.push(chk("description", !dl ? "fail" : (dl < 50 || dl > 175) ? "warn" : "pass", 8, { value: p.description.slice(0, 200), len: dl }));
  checks.push(chk("schema", p.localBusiness ? "pass" : p.jsonld.length ? "warn" : "fail", 12, { types: p.schemaTypes }));

  const noindex = p.noindex || /noindex/.test(xrobots);
  checks.push(chk("indexable", noindex ? "fail" : (status >= 400 || parked) ? "fail" : "pass", 14, { noindex, parked, httpStatus: status }));

  const hasRobots = robotsStatus === 200 && /user-agent/i.test(robotsText || "");
  checks.push(chk("sitemap", sitemapOk ? "pass" : "fail", 6, { robotsTxt: hasRobots }));

  const maps = MAPS_RE.test(html || "");
  checks.push(chk("maps", maps ? "pass" : "fail", 8));
  const wa = WA_RE.test(html || "");
  checks.push(chk("whatsapp", wa ? "pass" : "fail", 6));
  const book = BOOK_RE.test(html || "");
  checks.push(chk("booking", book ? "pass" : "warn", 4));

  // ChatGPT / AI answers: can AI crawlers read the site, and is there readable text in the HTML?
  const blockedAi = robots.groups.length ? AI_BOTS.filter(b => !robotsAllows(robots, b, "/")) : [];
  const readable = p.visibleChars >= 400;
  let ai = "pass";
  if (blockedAi.includes("gptbot") || blockedAi.includes("oai-searchbot") || !readable) ai = "fail";
  else if (blockedAi.length) ai = "warn";
  checks.push(chk("ai", ai, 12, { blocked: blockedAi, readable, chars: p.visibleChars }));

  return finish(checks, { finalUrl, status, blocked: false, parsed: p, robots, robotsStatus, sitemapOk });
}

const ORDER = ["indexable", "schema", "ai", "maps", "mobile", "speed", "title", "description", "https", "sitemap", "whatsapp", "booking"];

function finish(checks, ctx) {
  let got = 0, max = 0;
  for (const c of checks) { max += c.weight; got += c.status === "pass" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0; }
  const score = Math.round((got / max) * 100);
  // 3 fixes: biggest losses first
  const fixes = checks.filter(c => c.status !== "pass")
    .map(c => ({ id: c.id, loss: c.status === "fail" ? c.weight : c.weight / 2, tie: ORDER.indexOf(c.id) }))
    .sort((a, b) => b.loss - a.loss || a.tie - b.tie).slice(0, 3).map(f => f.id);
  return { score, checks, fixes, host: ctx.finalUrl.hostname, finalUrl: ctx.finalUrl.toString(), httpStatus: ctx.status, blocked: ctx.blocked };
}
