#!/bin/sh
# Wraps notify-leads.py with the secrets/config it needs. Edit the paths/IDs below for
# a different account; nothing here is a secret value, just where to find one.
set -eu
cd "$(dirname "$0")"
TAKTEKBOT_REPO="${TAKTEKBOT_REPO:-$HOME/work/taktekhq/taktekbot}"
export CLOUDFLARE_API_TOKEN="$("$TAKTEKBOT_REPO/bin/get" cloudflare-taktekbot-api-token)"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-5f012a200d9622ea6aecef1a02693e26}"
export KV_NAMESPACE_ID="${KV_NAMESPACE_ID:-535cab1bc8ab48718b46c94d46f2a0db}"
export SLACK_BIN="$TAKTEKBOT_REPO/bin/slack"
export SLACK_CHANNEL="${SLACK_CHANNEL:-C0C6BD12QBY}"
exec python3 notify-leads.py
