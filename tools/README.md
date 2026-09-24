# tools

## draft-note.sh

Reads the week's Claude Code transcripts and drafts one note for review.

```bash
./draft-note.sh        # last 7 days
./draft-note.sh 3      # last 3
```

Runs through the `claude` CLI headless, so it uses the auth already on this
laptop. **No API key is stored.** A key sitting in a cron job is a key nobody
rotates.

### It drafts. It does not publish.

Output lands in `~/work/taktekhq/note-drafts/YYYY-MM-DD.md`, outside this repo,
so nothing half-written can reach the site by accident. Review it, then move it
into `build-notes.py` and run `python3 build-notes.py && python3 build-og.py`.

The notes are first person about Nizar's own work. A cron job that publishes
unreviewed first-person claims about someone's life is the exact failure this
project has already hit twice, once inventing a phone and a partner in a
headline and once putting "we do the law" in a software company's terms.

### It is allowed to write nothing

The prompt says so outright: if no week produced a concrete, verifiable lesson,
write "nothing this week" and stop. A queue of thin drafts trains you to skip
the queue.

Each draft ends with an evidence section pointing at the transcript behind every
claim, so a fact can be checked without rereading the week.

### Logs

`~/work/taktekhq/note-drafts/.log` for the run history, `.last-run` for the
full output of the most recent one.
