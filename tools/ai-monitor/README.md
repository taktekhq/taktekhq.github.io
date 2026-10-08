# ai-monitor: weekly re-checks for "Monitor it weekly · $19/month" (taktek.io/ai/)

A robot, not a person (MAKE rule 8). Once a week it re-asks the assistants for every paying
subscriber through the audit Worker, compares with last week, and emails the answers plus an
"appeared / disappeared" line.

Flow: the visitor clicks "Start monitoring" on /ai/ → the page writes `intent:<key>` to KV
(business, city, category, website) → Stripe Payment Link with `client_reference_id=<key>` →
`monitor.py sync-stripe` turns paid Checkout Sessions into `sub:<key>` → `monitor.py run --send`
(weekly) re-checks with the `MONITOR_TOKEN` (skips the 24 h cache and rate limits) and mails.
Until the Payment Link exists, the page collects a monitoring request by email instead
(`lead:ai:*` with plan `monitor_19`, posted to Slack by notify-leads.py); add those by hand with
`monitor.py add` once they pay.

    python3 monitor.py list
    python3 monitor.py run                 # dry run: prints every email
    python3 monitor.py run --send          # sends and stores this week as "last"
    python3 monitor.py add --email a@b.co --name "Sitt Rima Bakery" --city "Aley, Lebanon" --category bakeries

Env vars are in the docstring of monitor.py. Stdlib only, Python 3.9+. The key it computes
matches the Worker's (tested on Latin, Arabic and "&" names).
