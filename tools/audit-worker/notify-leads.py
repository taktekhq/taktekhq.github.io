#!/usr/bin/env python3
"""Ping Slack for every audit-tool lead in KV that hasn't been reported yet.

Leads land in KV as "lead:<kind>:<timestamp>" (see src/index.js). This script lists
them, skips any with a matching "notified:<key>" marker, posts the rest to Slack, then
writes the marker so the same lead is never reported twice. Silent when nothing is new.

Config (env vars, no secrets or account IDs hardcoded):
  CLOUDFLARE_API_TOKEN   required, KV read/write + Workers KV permission
  CLOUDFLARE_ACCOUNT_ID  required
  KV_NAMESPACE_ID        required (see wrangler.toml)
  SLACK_BIN              path to a Slack-posting CLI that takes
                         "chat.postMessage channel=<id> text=<text>" (default: taktekbot/bin/slack
                         two levels up from the repos dir — override for any other setup)
  SLACK_CHANNEL          Slack channel ID to post to (required to actually notify;
                         without it, leads are only printed)
  METRICS_JSONL          path to append a {"collected_at", "total_leads", "new"} line to
                         after each run (default: monetization/money/metrics/audit-leads.jsonl
                         next to this repo — set to "" to skip)
"""
import datetime as dt
import json
import os
import subprocess
import sys

WRANGLER_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_METRICS_JSONL = os.path.expanduser("~/work/taktekhq/monetization/money/metrics/audit-leads.jsonl")


def wrangler(*args):
    out = subprocess.run(
        ["npx", "wrangler", "kv", *args, "--namespace-id", os.environ["KV_NAMESPACE_ID"]],
        cwd=WRANGLER_DIR, capture_output=True, text=True,
    )
    if out.returncode:
        sys.exit(f"wrangler {' '.join(args)} failed: {out.stderr.strip()}")
    return out.stdout


def main():
    for var in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "KV_NAMESPACE_ID"):
        if not os.environ.get(var):
            sys.exit(f"missing env var {var}")

    keys = [k["name"] for k in json.loads(wrangler("key", "list")) if k["name"].startswith("lead:")]
    notified = {k["name"] for k in json.loads(wrangler("key", "list", "--prefix", "notified:"))}
    new = [k for k in keys if f"notified:{k}" not in notified]

    metrics_path = os.environ.get("METRICS_JSONL", DEFAULT_METRICS_JSONL)
    if metrics_path:
        os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
        with open(metrics_path, "a") as f:
            f.write(json.dumps({
                "collected_at": dt.datetime.now().astimezone().isoformat(),
                "total_leads": len(keys),
                "new": len(new),
            }) + "\n")

    if not new:
        print("nothing new")
        return

    slack_bin = os.environ.get("SLACK_BIN", os.path.expanduser("~/work/taktekhq/taktekbot/bin/slack"))
    channel = os.environ.get("SLACK_CHANNEL")

    for key in new:
        lead = json.loads(wrangler("key", "get", key))
        text = (
            f"\U0001f4e5 taktek.io audit-tool lead ({lead.get('kind', '?')})\n"
            f"business: {lead.get('business', '-')}  where: {lead.get('where', '-')}  email: {lead.get('email', '-')}\n"
            f"package: {lead.get('package', '-')}  country: {lead.get('country', '-')}  at: {lead.get('at', '-')}\n"
            f"notes: {lead.get('notes', '-')}"
        )
        print(text)
        if channel:
            out = subprocess.run(
                [slack_bin, "chat.postMessage", f"channel={channel}", f"text={text}"],
                capture_output=True, text=True,
            )
            if out.returncode:
                sys.exit(f"slack post failed for {key}: {out.stderr.strip()}")
        wrangler("key", "put", f"notified:{key}", "1", "--ttl", "2592000")  # 30 days, matches lead TTL order of magnitude
        print(f"reported {key}")


if __name__ == "__main__":
    main()
