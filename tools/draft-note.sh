#!/bin/bash
# ==========================================================================
# Draft a note from the week's Claude Code transcripts.
#
# Runs headless through the claude CLI, so it uses the auth already on this
# laptop. No API key is stored anywhere, which is the point: a key sitting in
# a cron job is a key nobody rotates.
#
# It writes a DRAFT and publishes nothing. The notes are first person about
# Nizar's work, and a cron job that publishes unreviewed first-person claims
# about someone's own life is the exact failure this project keeps hitting.
# Review the draft, then move it into build-notes.py by hand.
#
#   ./draft-note.sh          look at the last 7 days
#   ./draft-note.sh 3        look at the last 3
# ==========================================================================
set -uo pipefail

DAYS="${1:-7}"
ROOT="$HOME/work/taktekhq"
DRAFTS="$ROOT/note-drafts"
LOG="$DRAFTS/.log"
SITE="$ROOT/taktekhq.github.io"
STAMP="$(date +%Y-%m-%d)"

mkdir -p "$DRAFTS"
cd "$SITE" || exit 1
exec >>"$LOG" 2>&1
echo "--- $(date '+%Y-%m-%d %H:%M') : looking back $DAYS days"

FILES="$(find "$HOME/.claude/projects" -name '*.jsonl' -mtime -"$DAYS" 2>/dev/null | head -40)"
if [ -z "$FILES" ]; then
  echo "no transcripts in the window. nothing to do."
  exit 0
fi
echo "$(echo "$FILES" | wc -l | tr -d ' ') transcripts in the window"

PROMPT=$(cat <<'EOP'
Read the Claude Code transcripts listed below. They are JSONL; each line is a
message. Look for ONE thing worth writing about publicly on taktek.io/notes.

What qualifies. A concrete, verifiable lesson from real work: something broke,
something caught it, or an assumption turned out wrong. It must be specific
enough that nobody else could write it, with real names, numbers, errors and
file paths from the transcripts.

What does not. General advice about AI or agents. Anything you cannot point at
a line in a transcript for. Anything already covered by an existing note in
taktekhq.github.io/build-notes.py, which you should read first.

IF THERE IS NOTHING THAT QUALIFIES, WRITE NOTHING. Say "nothing this week" and
stop. A thin note is worse than no note, because a queue of thin drafts trains
the reader to skip the queue.

If there is something, write a draft to the path given below, as markdown:

  # <title, plain, what the piece is about>
  slug: <kebab-case>
  date: <today, YYYY-MM-DD>

  ## stand
  <2-3 sentences that answer the title outright, quotable standalone, no teasing>

  ## desc
  <one sentence, 155 chars max, for the meta description>

  ## faqs
  Q: <a question someone would actually type>
  A: <a full answer, not a teaser>
  (three of these)

  ## body
  <the piece>

  ## evidence
  <bullet list: for each claim, which transcript and roughly where>

House style, non-negotiable, taken from nizarmah.com/reboot.html:
- First person singular. Short sentences, 5 to 15 words. One idea each.
- Paragraphs of one to three sentences.
- Plain words. Concrete specifics without explaining them.
- Fragments are fine. No em dashes. No semicolons. No marketing voice.
- Do not invent a feeling, a motive or a detail that is not in the transcripts.

Write only the file. Do not edit the live site, do not touch build-notes.py,
and do not commit anything.
EOP
)

OUT="$DRAFTS/$STAMP.md"
printf '%s\n\nTranscripts:\n%s\n\nWrite the draft to: %s\nExisting notes: %s/build-notes.py\n' \
  "$PROMPT" "$FILES" "$OUT" "$SITE" \
| claude -p \
    --add-dir "$HOME/.claude/projects" \
    --add-dir "$DRAFTS" \
    --permission-mode acceptEdits \
    >"$DRAFTS/.last-run" 2>&1

if [ -s "$OUT" ]; then
  echo "drafted: $OUT ($(wc -l <"$OUT" | tr -d ' ') lines)"
else
  echo "no draft written. tail of the run:"
  tail -5 "$DRAFTS/.last-run"
fi
