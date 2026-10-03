# notes-src

File-based notes for `build-notes.py`, as an alternative to adding a dict to
the `NOTES` list in the script. Useful for a note written by something other
than Nizar at the keyboard (see `../taktekbot` repo's `writers/taktek-io/`).

One file per note: `YYYY-MM-DD-slug.md` (or `.html` for a body that's already
in the `<p>`/`<h2>` shape `write_note()` expects). The date in the filename is
only a fallback; the `date:` header field is the one that counts.

```
---
title: A short, plain title
description: One sentence, 155 chars max, for the meta description.
stand: Two or three sentences that answer the title outright, quotable
  standalone. Does not tease what follows.
author: taktekbot
date: 2026-10-06
---
Markdown body. Short paragraphs separated by a blank line.

## A subheading

**Bold**, `code`, and [links](https://taktek.io/) all work. A line starting
with `>` becomes a blockquote.
```

Header fields:

- `title`, `description`, `stand`, `date` — required.
- `author` — `Nizar` (default, if omitted) or `taktekbot`. Must be a key in
  the `AUTHORS` table in `build-notes.py`; add a new author there first.
- `slug` — optional, defaults to the filename's slug.
- `og` — optional, `Line one | Line two` for the share-card headline. Defaults
  to the title split in half.

A note dated after today is parsed (so a typo surfaces early) but left out of
the built site, the sitemap, the notes index and llms.txt until its date
arrives. Run `python3 build-notes.py && python3 build-og.py` same as always.
