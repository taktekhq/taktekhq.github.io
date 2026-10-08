# taktek-audit Worker

Server-side fetcher behind https://taktek.io/audit/. One page + robots.txt + sitemap per audit, UA `TaktekAuditBot/1.0`, robots.txt honored, 8 s page timeout, 400 KB cap, no IP literals / odd ports (SSRF guard), 12 audits per IP per hour and 6 per domain per hour, 5 min result cache. Logs only `{domain, score}`. Opt-in leads (email + ticked consent) go to KV for 180 days.

- `GET /api/audit?url=example.com` returns `{score, checks[], fixes[], host, ...}` (language-neutral; the page translates).
- `POST /api/lead {email, consent:true, url, score, business, city, lang}`.

## AI visibility check (taktek.io/ai/)
- `POST /api/ai-check {name, city, category, website?}` asks each configured model three customer questions in parallel (20 s budget), returns `{summary:{recommended, asked, known}, answers[], competitors[], fixes[], models[], audit, key}`. Code in `src/ai.js`.
- Models: Gemini when `GEMINI_API_KEY` is set (`GEMINI_MODEL`, default `gemini-2.5-flash`; Google Search grounding unless `GEMINI_GROUNDING=0`); Claude when `ANTHROPIC_API_KEY` is set (`CLAUDE_MODEL`, default `claude-haiku-5-5`; web search unless `CLAUDE_WEB=0`). No key = `503 not_configured`.
- Cached 24 h in KV per business+city+category (`ai:v1:<hash>`); 6 fresh checks per IP per hour, 3 per business per hour. `MONITOR_TOKEN` bearer skips both (tools/ai-monitor).
- `/api/lead` sources `ai` (report email / monitoring request, consent), `ai_feedback`, `ai_monitor` (writes `intent:<key>` before the Stripe redirect).
- Logs: `{evt:"ai_check", category, city, recommended, asked, known, ms, country}`; never the business name or IP.
- Tests: `node test/ai-test.mjs` (mocked APIs).

## Test locally
    npm i && node test/cli.mjs taktek.io bbc.com      # logic only
    npx wrangler dev --port 8788 --local              # Worker; then serve the repo root on :8123 and open /audit/

## Deploy (needs the Cloudflare token; on the Mac)
    cd tools/audit-worker && npm i
    export CLOUDFLARE_API_TOKEN=$(~/work/taktekhq/taktekbot/bin/get cloudflare-taktekbot-api-token)
    npx wrangler kv namespace create KV        # paste the id into wrangler.toml (uncomment [[kv_namespaces]])
    npx wrangler deploy                        # prints https://taktek-audit.<account>.workers.dev
Then put that URL in `audit/config.js` (`window.AUDIT_API = "..."`), commit and push. Read leads with
`npx wrangler kv key list --binding KV --prefix lead:` and `npx wrangler kv key get --binding KV "<key>"`.
