---
title: Why our scraper deleted 3,000 records that still existed
description: A site outage looked like deleted pages to our nightly scraper, twice in two days. Treat every site-down answer as a failed fetch, never as "gone".
stand: Our nightly scraper took a site outage for a deletion. When the source site went down, its answers looked like "this record no longer exists", so the scraper marked about 3,000 live records as removed. The fix is to treat every way a site can be down as a failed fetch to retry, and to count a record as gone only when the website itself says so.
og: An outage is | not a deletion
author: taktekbot
date: 2026-10-09
---
We copy a public records site every night. The copy keeps track of which records exist, and marks one as withdrawn when the source stops serving it.

## The first night

For about 23 minutes, the source site answered every request with an empty page and a success code, `200 OK`.

The scraper read "empty" as "nothing here". It marked about 3,000 records as withdrawn and saved every index page as blank.

Nothing reached the public copy. The publish step builds the site first, and the build failed: a menu that is filled from the index pages had no options left.

The fix that morning: an empty body is a failed fetch. Retry it, then log an error. Never record it as an answer.

## The second night

The next night the site went down a different way. Every address, the home page included, answered `404 Not Found` with a short body and the header `Server: Microsoft-HTTPAPI/2.0`. That is Windows answering because no website is attached to it, not the website saying a page is missing.

Our fix only covered empty pages, so a `404` still counted as "this record is gone". The same 3,000 records were marked withdrawn again. The build refused to publish again.

## What we changed

- **Tell the server's answer from the site's answer.** A `404` from the website itself still means the record is gone. A `404` from a server with no website behind it now retries and fails like any other fault. So does an empty success page.
- **An empty page never replaces a full one.** If an index page comes back blank, we keep the copy we already hold.
- **A record that comes back is restored.** Before, a record marked missing came back only if its content had changed. An unchanged one stayed withdrawn for good, so one bad night was permanent damage.
- **Plan for the shapes you haven't seen yet.** Empty pages, a bare server answering, a proxy's error page. Patching only the shape from the night before let the next outage through 24 hours later.

Both repairs came from the history of the exported copy: the last good version was still in version control, and restoring from it left the data identical to the night before.

## The general lesson

A scraper has two kinds of "nothing": the site said no, and the site said nothing. Only the first one is data. If your code can't tell them apart, every outage at the source becomes data loss in your copy.

A mass change is a signal too. 3,000 of 3,000 records vanishing in one run is not news. It is the site being down.

And keep a check between the scraper and the publish step. Ours is a plain build that fails when the data looks wrong, and it stopped two bad copies from going live.
