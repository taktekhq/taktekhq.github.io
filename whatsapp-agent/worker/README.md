# taktek-wa-agent Worker
Stateless chat backend for taktek.io/whatsapp-agent/. Scripted engine first, Workers AI (llama-3.1-8b) only for messages with no intent.
- `npm i && npm test`; `npx wrangler dev --local` to run (POST /chat, GET /health)
- Edit `../engine.js` then `sh sync.sh` (the Worker needs its own copy)
- Deploy (needs the Cloudflare token): `cd worker && npm i && CLOUDFLARE_API_TOKEN=$(bin/get cloudflare) npx wrangler deploy`
  Expected URL: https://taktek-wa-agent.taktek-5f0.workers.dev (already set in ../config.js)
