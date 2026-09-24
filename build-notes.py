#!/usr/bin/env python3
"""Render the notes and their index.

Every note carries the same three schema blocks and the same shell, so they are
generated rather than copied. The prose lives in NOTES below.

Each note opens with a stand-first that answers the question in the title
outright. That paragraph is the one an answer engine lifts and attributes, so
it is written to be quotable on its own and never teases what follows.

  python3 build-notes.py
"""
import html, json, pathlib, re

GA = "G-MY112CQXP6"
SITE = "https://taktek.io"
AUTHOR = "Nizar"


def p(*paras):
    return "\n".join(f"    <p>{x}</p>" for x in paras)


def h2(t):
    return f'    <h2 id="{re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")}">{t}</h2>'


def quote(*lines):
    return "\n".join(f"    <blockquote>{x}</blockquote>" for x in lines)


NOTES = [
 dict(
  slug="two-verbs-for-a-mac",
  title="Two verbs, and evidence for both",
  date="2026-09-10", pretty="Thursday, September 10, 2026",
  desc="I gave an agent two verbs to drive a Mac: snapshot and act. No coordinates, elements addressed by identity, and every action returns proof it happened. Without the proof, the recipes built on top are folklore.",
  stand="Give an agent the smallest possible surface and make every action return evidence it worked. Two verbs beat twenty. Coordinates are the enemy, because a click at the right pixel on the wrong window looks exactly like success.",
  og=["Two verbs, and", "evidence for both."],
  faqs=[("How should an agent control a desktop?",
         "Address elements by identity, not by coordinates. A coordinate is correct only until something moves, and a click at the right pixel on the wrong window is indistinguishable from a click that worked. Identity survives layout changes and fails loudly when the element is gone."),
        ("Why should every action return evidence?",
         "Because a click that landed nowhere has to be distinguishable from one that worked. Without evidence, any procedure built on top of those actions is folklore: it worked once, nobody knows why, and nobody can tell when it stops working."),
        ("How many tools should an agent have?",
         "As few as will do the job. Two verbs, snapshot and act, cover desktop automation. Every extra tool is another way to be subtly wrong and another decision the model makes badly under load.")],
  body=[
   p("I wanted Claude Code to use my Mac. Not to write code about my Mac. To use it."),
   p("I gave it two verbs. <code>snapshot</code> and <code>act</code>."),
   p("That is the whole surface."),
   h2("No coordinates"),
   p("The obvious way is to screenshot the screen and click at x and y."),
   p("It is also the worst way."),
   p("A coordinate is correct until something moves. A window shifts, a font renders differently, a notification slides in. The click still happens. It lands somewhere else."),
   p("And it looks exactly like success."),
   p("So elements are addressed by identity instead. A role and a name. If the element is gone, the call fails loudly rather than clicking whatever moved into its place."),
   h2("Evidence, or it did not happen"),
   p("Every action returns proof it happened."),
   p("This is the part I would keep if I had to throw out everything else."),
   p("A click that landed nowhere has to be distinguishable from one that worked. Otherwise every recipe built on top is folklore. It worked once. Nobody knows why. Nobody can tell when it stopped."),
   h2("Three rungs"),
   p("There are three ways in, and they are not equal."),
   p("Accessibility, for native apps. Chrome's debug protocol, for pages. Screenshots, last."),
   p("Screenshots are last on purpose. A screenshot can only be acted on with coordinates, and coordinates are the thing I removed."),
   p("A <code>probe()</code> call reports which rungs are alive on your machine, because the answer differs per machine and guessing wastes an hour."),
   h2("The permissions catch"),
   p("Accessibility and Screen Recording are granted to your terminal application. Not to Claude Code."),
   p("Neither takes effect until you quit and reopen that terminal."),
   p("I lost time to this. It is in the README now, in bold, because it is the first thing that goes wrong."),
  ]),

 dict(
  slug="stop-after-two-failures",
  title="The same step failed twice, so it stopped",
  date="2026-09-11", pretty="Friday, September 11, 2026",
  desc="An agent hit the same error twice and halted instead of trying harder. It produced a bug report rather than a confident wrong answer, and the bug turned out to be mine.",
  stand="Give an agent a stop rule: if the same step fails twice in a row, halt and report. An agent that keeps retrying produces a confident wrong answer. One that stops produces a bug report, and a bug report is worth more.",
  og=["The same step failed", "twice, so it stopped."],
  faqs=[("What stop rule should an autonomous agent have?",
         "If the same step fails twice in a row, stop and report rather than trying an alternative route. Retrying past that point turns a clear failure into an unclear one, because the agent starts substituting methods and the final output no longer tells you what actually happened."),
        ("Why not let the agent find a workaround?",
         "Because a workaround hides the fault. An agent that falls back to a weaker method may still finish the task, and you will never learn that the primary method is broken until it fails somewhere you were not watching."),
        ("Should an agent mark a task complete if it could not verify it?",
         "No. If the verification step never ran, nothing was verified. Recording a completion date for a check that did not happen is worse than recording nothing, because it looks like evidence.")],
  body=[
   p("A task: verify a recipe still works, then stamp it with today's date."),
   p("It failed."),
   quote("asyncio.run() cannot be called from a running event loop"),
   p("It tried again. Same error."),
   p("Then it stopped."),
   h2("What it did instead of trying harder"),
   p("It ran <code>probe()</code> in between the attempts. The browser rung reported healthy, on the right URL."),
   p("So not a permissions problem. Not the page. A bug in my own tool."),
   p("It tried the accessibility rung as a fallback. That returned two elements, both window chrome, one of them a tooltip. Not page content."),
   p("It could have taken a screenshot and clicked by coordinate. That is against the rules I gave it, so it did not."),
   p("Then it wrote down what happened and stopped."),
   h2("The part I care about"),
   p("It did not stamp the recipe."),
   p("The assertion never ran, so nothing was verified, so there was nothing to date. A completion date for a check that did not happen is worse than no date. It looks like evidence."),
   p("Every agent I have used would have found a way to feel finished."),
   h2("The bug was mine"),
   p("Nested event loop in my server. I restarted the MCP process and it was gone."),
   p("The recipe verified on the next run. 49 links matched the assertion, which needed at least 3."),
   p("An agent that retries forever would have eventually produced something. It would have been wrong, and it would have sounded certain."),
   p("This one produced a bug report."),
  ]),

 dict(
  slug="assert-on-a-different-channel",
  title="Assert on a channel you did not write to",
  date="2026-09-12", pretty="Saturday, September 12, 2026",
  desc="An agent typed a repository name and the field silently ignored it. Reading the DOM back said the write worked. Checking a different channel is the only assertion worth making.",
  stand="An assertion that reads the same channel you wrote to proves nothing. If an agent sets a value through the DOM and then reads the DOM, it has confirmed its own memory. Verify through a different path: a file on disk, a command-line tool, a second page.",
  og=["Assert on a channel", "you did not write to."],
  faqs=[("How do you verify that an agent's action actually worked?",
         "Check through a channel other than the one you wrote through. If the agent typed into a form via the browser, confirm the result with something outside the browser. Reading back the same field only confirms the agent remembers what it typed."),
        ("Why can reading the DOM back give a false positive?",
         "Because frameworks intercept input. A React controlled input can accept a programmatic value, display it, and still ignore it when the form submits, since the component state never changed. The DOM says the write landed. The server disagrees."),
        ("What does a good assertion look like?",
         "It uses a different tool than the action did. An SSH key read out of a password manager in a browser can be verified by writing it to disk and running ssh-keygen against it: if the derived public key and fingerprint match what the browser showed, the read was correct.")],
  body=[
   p("Two tasks on the same day. One assertion was good. One was missing."),
   h2("The good one"),
   p("Get an SSH key out of Bitwarden and onto disk."),
   p("The agent drove the extension, opened the item, revealed the key, and read the private and public halves out of the page."),
   p("Then it wrote both to disk and ran <code>ssh-keygen</code> against the private one."),
   p("The derived public key matched what the browser had shown. The fingerprint matched too."),
   p("That is an assertion worth having. The write went through a browser. The check went through a command-line tool that does not know the browser exists."),
   h2("The missing one"),
   p("Same day. Create a private repository and name it <code>agent-tasks</code>."),
   p("The agent set the name field. The field displayed the name. The form submitted."),
   p("The repository is called <code>ubiquitous-happiness</code>."),
   p("React controlled input. A programmatic value is accepted and displayed, and then ignored on submit, because the component's own state never changed."),
   p("Reading the field back would have said the write worked. The field was the channel it wrote to."),
   h2("The rule"),
   p("An assertion must read a different channel than the write."),
   p("Not a different element. A different path. A file, a tool, a fresh page load, an API response."),
   p("Anything that could not have been fooled by the same mistake."),
   p("I still have a repository named after a thing the agent did not choose. It is a decent reminder."),
  ]),

 dict(
  slug="stop-an-llm-inventing-facts",
  title="How I stop an LLM from inventing facts",
  date="2026-09-25", pretty="Thursday, September 25, 2026",
  desc="A model rewrote a law firm's website twice. Every number is compared as a multiset and a page whose facts do not match is rejected whole. What the guard caught, what it missed, and the sentence it wrote that no check would have seen.",
  stand="Do not let the model write to the page. Let it propose, then compare every number in the output against the input as a multiset. If they do not match, reject the whole page. That catches invented figures. It does not catch changed meaning, and changed meaning is the one that gets you.",
  og=["How I stop an LLM", "from inventing facts."],
  faqs=[("How do you stop an LLM from inventing facts?",
         "Do not let the model write to the page. Let it write a proposal, then compare every number, percentage, date and citation in the output against the input as a multiset. If they do not match, reject the whole page rather than applying part of it. An invented figure is a token that was not in the source, which makes it mechanically detectable."),
        ("What can a numeric guard not catch?",
         "Meaning. A model can keep every number and still change what a sentence permits. 'It may serve clients anywhere' became 'It serves clients anywhere', which turns a permission into a habit. Same numbers, same markup, different law. Only reading catches that."),
        ("Why reject the whole page instead of one paragraph?",
         "Because a partially applied rewrite is harder to review than either version. If one unit fails, you no longer know which half of the page you are reading."),
        ("Does a false rejection matter?",
         "More than a missed one. A guard that cries wolf gets skimmed, and skimming is how the real failure gets through. A guard rejecting 'prices are shown in US dollars' for containing the pronoun 'us' has to be fixed the same day.")],
  body=[
   p("I let a model rewrite a law firm's website. Twice."),
   p("The firm is my partner's. The pages state Lebanese company law. Capital minimums, tax rates, article numbers."),
   p("Getting one wrong is not a typo. It is a lawyer publishing something false."),
   p("So the model never writes to the page. It writes a proposal. A guard decides."),
   h2("The guard"),
   p("Every number in the output is compared against the input. As a multiset, not a set. Two mentions of 17% are not one."),
   p("If they do not match, the whole page is rejected. Not the paragraph. The page."),
   p("That sounds heavy-handed. It is the point. A half-applied rewrite is harder to review than either version, because you no longer know which half you are reading."),
   h2("The first rejection was mine"),
   p("It threw out the offshore guide. Six invented numbers and a changed citation."),
   p("Both were my fault."),
   p("My HTML-to-markdown emitter wrote <code>1.</code> for every ordered list item. The model counted properly. Six list items, six numbers that were not in the source."),
   p("And I had normalised <code>art. 7</code> to <code>Article 7</code> before comparing."),
   p("Neither was a fact changing. The guard was wrong, not the model."),
   h2("What the guard cannot see"),
   p("One paragraph came back like this."),
   quote("It may serve clients anywhere.", "It serves clients anywhere."),
   p("Same numbers. Same tags. Same length."),
   p("A permission turned into a habit, on a page about what a company is allowed to do."),
   p("Another one. An auditor is mandatory above a capital threshold, or if partners holding a fifth ask for one. Two triggers, both mandatory."),
   p("It came back as “partners may ask for one.” A trigger turned into a right."),
   p("I caught both by reading. There is no check for it."),
   h2("The worst one"),
   p("The formation sites are operated by a software company. The legal work is done by the firm. Two companies, on purpose."),
   p("I asked the model to write the terms. It came back in the first person."),
   quote("We do the law."),
   p("Published by a software company. In the one document a regulator would quote back."),
   p("Now the guard rejects <code>we</code>, <code>us</code>, <code>our</code> and <code>ours</code> outright."),
   p("The first rerun failed seven of ten sections on it. That is not a near miss. That is a model refusing to hold a constraint."),
   p("Repeating the rule in the user prompt, not just the system prompt, fixed it."),
   h2("A guard that cries wolf gets ignored"),
   p("Mine rejected “prices are shown in US dollars.” It was matching <code>us</code> case-insensitively."),
   p("I made it case-sensitive the same hour."),
   p("If I had left it, I would have started skimming the rejections. Skimming is how the real one gets through."),
   h2("What I actually do now"),
   p("Guards catch the shape of error you thought of. Numbers, markup, pronouns. Not meaning."),
   p("So I still read every diff. Across four sites, 49 rewrites landed. I reverted three by hand."),
   p("The model is a fast writer with no stake in being right. The guard is cheap. The reading is the job."),
  ]),
]


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} &mdash; taktek</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#F7F5F1" media="(prefers-color-scheme:light)">
<meta name="theme-color" content="#0D0D0E" media="(prefers-color-scheme:dark)">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="{author}, Taktek">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="taktek">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{site}/assets/og/{slug}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{site}/assets/og/{slug}.png">
<meta property="article:published_time" content="{date}">
<link rel="icon" href="../../assets/logos/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/og/apple-touch.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/studio.css">
<link rel="stylesheet" href="../../assets/css/gravity.css">
<script async src="https://www.googletagmanager.com/gtag/js?id={ga}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{ga}', {{ anonymize_ip: true }});
</script>
<script type="application/ld+json">
{article}
</script>
<script type="application/ld+json">
{faq}
</script>
<script type="application/ld+json">
{crumb}
</script>
</head>
<body>

<div class="wrap">
  <header class="head">
    <a class="mark" href="../../">taktek<i aria-hidden="true"></i></a>
    <input type="checkbox" id="mode">
    <label class="modebtn" for="mode" title="Switch appearance" aria-label="Switch appearance">
      <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
      <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
    </label>
  </header>

<main>
  <article class="note">
    <h1>{title}</h1>
    <p class="when">{pretty}</p>

    <p class="stand">{stand}</p>

{body}

    <hr>
    <p class="when"><a href="../">All notes</a> &middot; <a href="../../">taktek.io</a></p>
  </article>

  <footer>
    <a href="../">Notes</a>
    <a href="../../terms/">Terms</a>
    <a href="../../privacy/">Privacy</a>
    <a href="../../support/">Support</a>
    <a class="spacer" href="https://github.com/taktekhq">github.com/taktekhq</a>
  </footer>
</main>
</div>

<script src="../../assets/js/gravity.js"></script>
</body>
</html>
"""


def write_note(n):
    url = f"{SITE}/notes/{n['slug']}/"
    article = json.dumps({
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": n["title"], "description": n["desc"],
        "datePublished": n["date"], "dateModified": n["date"], "inLanguage": "en",
        "url": url, "mainEntityOfPage": url,
        "image": f"{SITE}/assets/og/{n['slug']}.png",
        "author": {"@type": "Person", "name": AUTHOR, "url": SITE + "/"},
        "publisher": {"@type": "Organization", "name": "Taktek, LLC", "url": SITE + "/"},
    }, indent=2)
    faq = json.dumps({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a}}
                       for q, a in n["faqs"]]}, indent=2)
    crumb = json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "taktek", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Notes", "item": SITE + "/notes/"},
            {"@type": "ListItem", "position": 3, "name": n["title"], "item": url}]}, indent=2)
    d = pathlib.Path("notes") / n["slug"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(HEAD.format(
        title=html.escape(n["title"]), desc=html.escape(n["desc"]), url=url, site=SITE,
        slug=n["slug"], date=n["date"], pretty=n["pretty"], author=AUTHOR, ga=GA,
        stand=n["stand"], body="\n\n".join(n["body"]),
        article=article, faq=faq, crumb=crumb))
    return d


if __name__ == "__main__":
    for n in NOTES:
        d = write_note(n)
        print(f"{d}/index.html  {(d/'index.html').stat().st_size:,} bytes")
