#!/usr/bin/env python3
"""Weekly AI-visibility monitor for $19/month subscribers (taktek.io/ai/).

Subscribers live in the audit Worker's KV as "sub:<key>" (key = the check's hash, also
the Stripe client_reference_id). Each run re-asks the assistants through the Worker
(/api/ai-check with the MONITOR_TOKEN, so no cache or rate limit), compares with last
week, and emails the report. Stdlib only.

  monitor.py sync-stripe          # paid Checkout Sessions of the monitor Payment Link -> sub:<key>
  monitor.py add --email E --name N --city C --category K [--website W]   # manual subscriber
  monitor.py list
  monitor.py run [--send] [--only KEY]   # default is a dry run that prints the emails

Env:
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID   KV read/write (see ../audit-worker/wrangler.toml)
  WORKER_URL       default https://taktek-audit.taktek-5f0.workers.dev
  MONITOR_TOKEN    same value as the Worker secret MONITOR_TOKEN
  STRIPE_KEY       restricted key (read Checkout Sessions + Subscriptions), for sync-stripe and status checks
  AI_MONITOR_PLINK the monitor Payment Link id (plink_...)
  MAIL_CMD         command that sends one email: run as `MAIL_CMD <to> <subject>` with the plain-text body on stdin
  METRICS_JSONL    optional: append {"collected_at","subscribers","sent"} per run
"""
import argparse
import datetime as dt
import hashlib
import json
import os
import shlex
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request

WORKER = os.environ.get("WORKER_URL", "https://taktek-audit.taktek-5f0.workers.dev").rstrip("/")


def http(method, url, headers=None, data=None, timeout=60):
    req = urllib.request.Request(url, method=method, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


# --- KV over the Cloudflare REST API ---------------------------------------------
def kv_base():
    for v in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "KV_NAMESPACE_ID"):
        if not os.environ.get(v):
            sys.exit(f"missing env var {v}")
    return (f"https://api.cloudflare.com/client/v4/accounts/{os.environ['CLOUDFLARE_ACCOUNT_ID']}"
            f"/storage/kv/namespaces/{os.environ['KV_NAMESPACE_ID']}")


def cf_headers():
    return {"authorization": "Bearer " + os.environ["CLOUDFLARE_API_TOKEN"]}


def kv_keys(prefix):
    out, cursor = [], ""
    while True:
        q = urllib.parse.urlencode({"prefix": prefix, **({"cursor": cursor} if cursor else {})})
        j = json.loads(http("GET", f"{kv_base()}/keys?{q}", cf_headers()))
        out += [k["name"] for k in j["result"]]
        cursor = j.get("result_info", {}).get("cursor")
        if not cursor:
            return out


def kv_get(key):
    try:
        return json.loads(http("GET", f"{kv_base()}/values/{urllib.parse.quote(key, safe='')}", cf_headers()))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def kv_put(key, value):
    http("PUT", f"{kv_base()}/values/{urllib.parse.quote(key, safe='')}",
         {**cf_headers(), "content-type": "application/json"}, json.dumps(value).encode())


# --- the same key the Worker uses (fold() in src/ai.js, sha() in src/index.js) ---------
def fold(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(c for c in s if not ("̀" <= c <= "ͯ" or "ً" <= c <= "ْ")).lower()
    s = s.replace("’", "").replace("'", "").replace("`", "")
    out, prev_space = [], False
    for c in s:
        ok = ("a" <= c <= "z") or ("0" <= c <= "9") or ("؀" <= c <= "ۿ")
        if ok:
            out.append(c); prev_space = False
        elif not prev_space:
            out.append(" "); prev_space = True
    return "".join(out).strip()


def check_key(name, city, category):
    return hashlib.sha256(f"{fold(name)}|{fold(city)}|{fold(category)}".encode()).hexdigest()[:16]


# --- Stripe -----------------------------------------------------------------------------
def stripe(path, **params):
    key = os.environ.get("STRIPE_KEY") or sys.exit("missing env var STRIPE_KEY")
    q = urllib.parse.urlencode(params, doseq=True)
    return json.loads(http("GET", f"https://api.stripe.com/v1/{path}?{q}", {"authorization": "Bearer " + key}))


def sync_stripe(_args):
    plink = os.environ.get("AI_MONITOR_PLINK") or sys.exit("missing env var AI_MONITOR_PLINK")
    added = 0
    for s in stripe("checkout/sessions", payment_link=plink, status="complete", limit=100)["data"]:
        key = (s.get("client_reference_id") or "").strip()
        email = (s.get("customer_details") or {}).get("email")
        if not key or not email:
            print(f"! session {s['id']}: no client_reference_id/email, add it by hand with `add`")
            continue
        if kv_get(f"sub:{key}"):
            continue
        intent = kv_get(f"intent:{key}") or {}
        if not intent.get("business"):
            print(f"! session {s['id']}: paid, but no intent:{key} in KV; add the business by hand with `add`")
            continue
        sub = {"key": key, "email": email, "name": intent["business"], "city": intent.get("city", ""), "category": intent.get("category", ""),
               "website": intent.get("website", ""), "lang": intent.get("lang", "en"), "subscription": s.get("subscription"),
               "since": dt.datetime.fromtimestamp(s["created"], dt.timezone.utc).isoformat(), "last": None}
        kv_put(f"sub:{key}", sub)
        added += 1
        print(f"+ {email}: {sub['name']} ({sub['city']})")
    print(f"{added} new subscriber(s)")


def add(args):
    key = check_key(args.name, args.city, args.category)
    sub = {"key": key, "email": args.email, "name": args.name, "city": args.city, "category": args.category, "website": args.website or "",
           "lang": args.lang, "subscription": args.subscription, "since": dt.datetime.now(dt.timezone.utc).isoformat(), "last": None}
    kv_put(f"sub:{key}", sub)
    print(f"added sub:{key}")


def subscribers():
    return [s for s in (kv_get(k) for k in kv_keys("sub:")) if s]


def list_(_args):
    for s in subscribers():
        last = (s.get("last") or {}).get("summary")
        print(f"{s['key']}  {s['email']}  {s['name']} / {s['city']} / {s['category']}  last={last}")


# --- the weekly run -------------------------------------------------------------------------
def active(sub):
    if not sub.get("subscription") or not os.environ.get("STRIPE_KEY"):
        return True
    try:
        st = stripe(f"subscriptions/{sub['subscription']}")["status"]
    except Exception as e:  # noqa: BLE001 - a Stripe hiccup must not drop a paying customer's report
        print(f"  ! stripe status failed ({e}); sending anyway")
        return True
    return st in ("active", "trialing", "past_due")


def run_check(sub):
    tok = os.environ.get("MONITOR_TOKEN") or sys.exit("missing env var MONITOR_TOKEN")
    body = json.dumps({"name": sub["name"], "city": sub["city"], "category": sub["category"], "website": sub.get("website", "")}).encode()
    return json.loads(http("POST", WORKER + "/api/ai-check", {"content-type": "application/json", "authorization": "Bearer " + tok}, body, timeout=60))


def compose(sub, r, prev):
    s, p = r["summary"], (prev or {}).get("summary")
    name = sub["name"]
    if p is None:
        change = "This is your first weekly report."
    elif s["recommended"] > 0 and p["recommended"] == 0:
        change = f"Good news: {name} started appearing this week."
    elif s["recommended"] == 0 and p["recommended"] > 0:
        change = f"Heads up: {name} disappeared from the answers this week."
    elif s["recommended"] != p["recommended"]:
        change = f"Named in {s['recommended']} of {s['asked']} answers, up from {p['recommended']}." if s["recommended"] > p["recommended"] else f"Named in {s['recommended']} of {s['asked']} answers, down from {p['recommended']}."
    else:
        change = "No change since last week."
    subject = f"{name}: named in {s['recommended']} of {s['asked']} AI answers this week" + (" (new!)" if p and s["recommended"] > p["recommended"] else "")
    models = ", ".join(f"{m['label']} ({m['model']}{', web search' if m['web'] else ''})" for m in r["models"])
    lines = [f"Weekly AI visibility report for {name} ({sub['category']}, {sub['city']})", "", change, "",
             f"Asked: {models}, on {r['checkedAt'][:16].replace('T', ' ')} UTC. (We don't ask ChatGPT itself; these work the same way.)", "",
             f"Recommended you: {s['recommended']} of {s['asked']} answers. Know who you are when asked by name: {'yes' if s['known'] else 'no'}.", ""]
    if r["competitors"]:
        lines.append("Who they named instead: " + ", ".join(f"{c['name']} ({c['n']}x)" for c in r["competitors"][:6]))
        lines.append("")
    for q in r["questions"]:
        lines.append(f"Q: {q['text']}")
        for a in (x for x in r["answers"] if x["q"] == q["id"]):
            label = next((m["label"] for m in r["models"] if m["id"] == a["model"]), a["model"])
            lines.append(f"  {label}: " + ("(no answer this week)" if a.get("error") else ("NAMED YOU. " if a.get("mentioned") else "") + a["text"].replace("**", "").replace("\n", " ")[:600]))
        lines.append("")
    lines += ["Want us to fix it? Reply to this email or see https://taktek.io/work/ (visibility setup, $400).",
              "Manage or cancel your $19/month monitoring any time: reply 'cancel' and we stop it the same day.",
              "", "Taktek · https://taktek.io/ai/"]
    return subject, "\n".join(lines)


def send(to, subject, body):
    cmd = os.environ.get("MAIL_CMD") or sys.exit("missing env var MAIL_CMD (use a dry run, or wire the mail path)")
    out = subprocess.run(shlex.split(cmd) + [to, subject], input=body, text=True, capture_output=True)
    if out.returncode:
        raise RuntimeError(out.stderr.strip()[:300])


def run(args):
    subs = [s for s in subscribers() if not args.only or s["key"] == args.only]
    sent = 0
    for sub in subs:
        print(f"- {sub['email']}: {sub['name']} / {sub['city']}")
        if not active(sub):
            print("  inactive subscription, skipped")
            continue
        try:
            r = run_check(sub)
        except Exception as e:  # noqa: BLE001
            print(f"  ! check failed: {e}")
            continue
        if not r.get("ok"):
            print(f"  ! check error: {r}")
            continue
        subject, body = compose(sub, r, sub.get("last"))
        if args.send:
            try:
                send(sub["email"], subject, body)
            except Exception as e:  # noqa: BLE001
                print(f"  ! mail failed: {e}")
                continue
            sub["last"] = {"summary": r["summary"], "at": r["checkedAt"], "competitors": r["competitors"][:6]}
            kv_put(f"sub:{sub['key']}", sub)
            sent += 1
            print(f"  sent: {subject}")
        else:
            print(f"  DRY RUN, would send:\n  Subject: {subject}\n" + "\n".join("  | " + l for l in body.splitlines()))
    path = os.environ.get("METRICS_JSONL")
    if path:
        with open(path, "a") as f:
            f.write(json.dumps({"collected_at": dt.datetime.now().astimezone().isoformat(), "subscribers": len(subs), "sent": sent}) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("sync-stripe").set_defaults(fn=sync_stripe)
    a = sp.add_parser("add"); a.set_defaults(fn=add)
    for f in ("email", "name", "city", "category"):
        a.add_argument("--" + f, required=True)
    a.add_argument("--website"); a.add_argument("--lang", default="en"); a.add_argument("--subscription")
    sp.add_parser("list").set_defaults(fn=list_)
    r = sp.add_parser("run"); r.set_defaults(fn=run); r.add_argument("--send", action="store_true"); r.add_argument("--only")
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
