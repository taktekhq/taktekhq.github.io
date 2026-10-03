#!/usr/bin/env python3
"""Render the notes and their index.

Every note carries the same three schema blocks and the same shell, so they are
generated rather than copied. The prose lives in NOTES below.

Each note opens with a stand-first that answers the question in the title
outright. That paragraph is the one an answer engine lifts and attributes, so
it is written to be quotable on its own and never teases what follows.

  python3 build-notes.py
"""
import datetime, html, json, pathlib, re

GA = "G-MY112CQXP6"
SITE = "https://taktek.io"
AUTHOR = "Nizar"
NOTES_SRC = pathlib.Path("notes-src")
NOTES_DESC = ("Field notes from Taktek's agent fleet: how agents finish real "
              "work, what breaks, and what catches it.")

# Per-author identity. A note with no "author" key defaults to AUTHOR
# ("Nizar"). Giving a note author="taktekbot" is the only step needed to run
# it under the bot's own byline instead: write_note(), the notes index and
# llms.txt all key off this table, and Nizar's output is unchanged because his
# entry here reproduces exactly what was hard-coded before.
AUTHORS = {
    "Nizar": dict(
        ld={"@type": "Person", "name": "Nizar", "url": SITE + "/"},
        meta="Nizar, Taktek",
    ),
    "taktekbot": dict(
        ld={"@type": "Organization", "name": "taktekbot",
            "url": "https://taktekbot.com/",
            "description": "Taktek's founding agent"},
        meta="taktekbot, Taktek's founding agent",
    ),
}


def p(*paras):
    return "\n".join(f"    <p>{x}</p>" for x in paras)


def h2(t):
    return f'    <h2 id="{re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")}">{t}</h2>'


def quote(*lines):
    return "\n".join(f"    <blockquote>{x}</blockquote>" for x in lines)


NOTES = [
 dict(
  slug="what-an-agent-studio-does",
  title="What an agent studio does",
  date="2026-09-29", pretty="Tuesday, September 29, 2026",
  desc="Taktek is an agent studio. You hire an Agent, long term or per objective, or a Fleet for one big objective. What that means, and what a person still does.",
  stand="An agent studio sells finished work done by AI agents. At Taktek you hire one of two things: an Agent, which works your backlog every day or takes a single objective, or a Fleet, many agents on one big objective such as a mass migration. A person signs off on anything that can't be undone.",
  og=["What an agent", "studio does."],
  faqs=[("What is an agent studio?",
         "A studio that sells finished work done by AI agents instead of hours of human work. The agents write, run and check the work. A person decides what gets built, designs the checks, and signs off on anything that can't be undone."),
        ("What is the difference between an Agent and a Fleet?",
         "An Agent is one AI agent. You hire it long term to work a backlog every day, or for a single objective. A Fleet is many agents on one objective, such as a mass migration, and is only ever hired for an objective."),
        ("Who is behind Taktek?",
         "Nizar Mahmoud. Taktek has two companies, both his: Taktek, LLC, registered in Delaware, and Taktek Offshore SAL, in Aley, Lebanon.")],
  body=[
   p("People ask what Taktek does. The short answer is on the home page: an agent studio."),
   p("This is the longer answer."),
   h2("Two things you can hire"),
   p("An <b>Agent</b> is one AI agent. Hire it long term and it works your backlog every day. Hire it for one objective and it stops when the objective is met."),
   p("A <b>Fleet</b> is many agents on one objective. A mass migration. A rewrite nobody has time for. Something that would take a team months."),
   p("A Fleet is only ever hired for an objective. Many agents without a finish line is just a bill."),
   h2("What we need from you"),
   p("Four things. They're already in the email the home page opens for you."),
   p("The work. Where it lives: a repository, a tool, an inbox. Long term or one objective. And how we'll both know it's done."),
   p("The last one matters most. If nobody can say what done looks like, no agent can finish it."),
   h2("What the agents do"),
   p("They write the work, run it, and check it."),
   p("For a migration, the old code is the spec. Each piece they port is compared with the old one on real data before a person looks at it."),
   p("They open pull requests. They don't merge them."),
   h2("What a person still does"),
   p("Everything that can't be undone. Merging. Deploying. Raising a rollout. Spending money."),
   p("Everywhere else, a person in the loop slows the agents down without making anything safer."),
   h2("What it has built"),
   p('The same agents built everything on the <a href="../../portfolio/">portfolio</a>. A fashion catalogue of 39 brands that refreshes itself every morning. A directory of Lebanese businesses. A tool that finds threads worth replying to, built in two days.'),
   h2("Who is behind it"),
   p("Me, Nizar. Taktek, LLC is registered in Delaware. Taktek Offshore SAL is in Aley, Lebanon."),
   p('If you have work that would otherwise take months, <a href="mailto:nizar@taktek.io?subject=Hey%20Nizar!">write to me</a>.'),
  ]),
 dict(
  slug="the-old-code-is-the-spec",
  title="The old code is the spec",
  date="2026-09-29", pretty="Tuesday, September 29, 2026",
  desc="Migrating code with agents goes fast once you stop writing a spec. The running system already is one. Port a piece, compare it on real data, ship what matches.",
  stand="When agents migrate code, don't write a spec. The old system already is one. Port a piece, run old and new on the same real inputs, and ship only what matches. Then you review the check, not the diff.",
  og=["The old code", "is the spec."],
  faqs=[("How do you verify code an AI agent migrated?",
         "Run the old and the new code on the same real inputs and compare the outputs. If they match on real data, the port is right. If they don't, the difference is the bug, already isolated. Reviewing that comparison is faster and safer than reading every line of the diff."),
        ("Why not write tests for the new code first?",
         "Because the tests would be a second, weaker copy of what the old code already does. The old code handles every case it has ever met, including the ones nobody remembers. Comparing against it catches what a hand-written suite would miss."),
        ("How should a migrated piece go live?",
         "Behind a flag that starts at a small share of traffic and only rises after enough requests succeed, not after a fixed time. Most errors show up in that first small share, where they are cheap.")],
  body=[
   p("Every migration I did by hand started the same way. Write down what the old code does. Then make the new code do that."),
   p("The writing-down part took longest. And it was always incomplete."),
   h2("The spec already exists"),
   p("The old code runs. It handles every case it has ever met, including the ones nobody remembers."),
   p("So it is the spec. The most complete one you will ever have."),
   p("An agent ports one piece. Then the old piece and the new piece get the same real inputs, anonymized. If the outputs match, the port is right. If they don't, the difference is the bug."),
   h2("Review the check, not the diff"),
   p("A migration diff is too big to read. Nobody reads it. People skim it, and skimming is how the bug gets through."),
   p("A comparison is small. It says which cases ran and which matched. That is what a person reviews."),
   p("It has one trap. The harness fakes the services the code talks to, and a fake that accepts what the real service rejects will pass a port that fails on its first real call. So every fake has to reject what the real thing rejects."),
   p("And a case that never ran is not a pass. If a comparison skips cases, the piece isn't done."),
   h2("Ship on evidence, not on time"),
   p("A ported piece goes live behind a flag. The flag starts at a sliver of traffic and only rises after enough requests succeed. Not after a day. After evidence."),
   p("Most errors show up in that first sliver, where they are cheap."),
   h2("Where the person goes"),
   p("An agent can port, compare and propose. It doesn't merge, and it doesn't raise a flag on its own."),
   p("Those are the steps that can't be undone. They are the whole job left for a person."),
   p('If you have a migration you keep postponing, <a href="mailto:nizar@taktek.io?subject=Hey%20Nizar!%20I%20need%20a%20Fleet">that is what a Fleet is for</a>.'),
  ]),
 dict(
  slug="a-fleet-from-a-phone",
  title="Running a fleet of agents from a phone",
  date="2026-09-29", pretty="Tuesday, September 29, 2026",
  desc="Two old machines that never turn off, and a phone. How one person gives agents work, follows it, and signs off on what can't be undone, away from a desk.",
  stand="You don't need a desk to run agents. Two old machines stay on, the agents run on them, and a phone is where work goes in and approvals come out. The person's job shrinks to the steps that can't be undone.",
  og=["A fleet of agents,", "from a phone."],
  faqs=[("Can you run coding agents from a phone?",
         "Yes. The agents run on machines that stay on, and the phone only sends work, reads progress and approves the steps that can't be undone. The machines do the work; the phone steers."),
        ("What hardware does it take?",
         "Old machines are enough. Most of an agent's work happens at the model provider and in ordinary tools, so a laptop that would otherwise sit in a drawer can keep agents running all day."),
        ("What does the person still do?",
         "Decide what gets built, design the checks that say whether it worked, and approve anything that can't be undone, like a merge or a deploy.")],
  body=[
   p("I do most of my work away from a desk now."),
   p("That isn't a productivity trick. It's what happens when the work runs somewhere else."),
   h2("The setup"),
   p("Two old machines that stay on. A Mac and a Linux laptop that would otherwise be in a drawer."),
   p("Agents run on them, in sessions that restart themselves after a crash or a reboot. A watchdog checks that they're alive."),
   p("The phone is where work goes in and approvals come out."),
   h2("What runs on it"),
   p('Everything on the <a href="../../portfolio/">portfolio</a>.'),
   p("closet.ai re-reads six fashion retailers every morning. The run takes about seven hours, and nobody watches it."),
   p("A directory of Lebanese businesses went from 1,622 listings to 4,569 in a day, built from public data sources."),
   p("Lurker, a tool that finds threads worth replying to, went from first commit to live site in two days."),
   p("Across twenty repositories, that was about 800 commits in thirty days."),
   h2("What I do"),
   p("I say what to build and what done looks like."),
   p("I design the checks. A check is what lets me not read the code."),
   p("And I approve the steps that can't be undone: merges, deploys, anything that spends money."),
   p("Everything else, I read about later."),
   h2("What breaks"),
   p("Machines reboot. A keyring locks after a restart, and every push fails until it is unlocked. A scheduled job stops firing without an error."),
   p("So the rule for the setup is the same as for the agents: fail loudly. A job that silently does nothing is worse than one that crashes."),
   p("The schedule that stopped firing was replaced by a wake every five minutes that checks whether it's time. Less precise. Never silent."),
  ]),
 dict(
  slug="two-verbs-for-a-mac",
  title="Two verbs, and evidence for both",
  date="2026-09-10", pretty="Thursday, September 10, 2026",
  desc="I gave an agent two verbs to drive a Mac: snapshot and act. No coordinates, and every action returns proof it happened. Without proof, recipes are folklore.",
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
  desc="An agent hit the same error twice and stopped instead of trying harder. It wrote a bug report, not a confident wrong answer. The bug was mine.",
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
  desc="An agent typed into a field that silently ignored it, and reading the DOM back said it worked. The only assertion worth making checks a different channel.",
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
  desc="A model rewrote a law firm's website twice. Each number is checked as a multiset; a page whose facts don't match is rejected whole. What that caught and missed.",
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


def _short_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%b')} {d.year}"


def _pretty_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%A')}, {d.strftime('%B')} {d.day}, {d.year}"


def _og_from_title(title):
    """Fall back for a file-based note with no `og:` header: split the title
    into two roughly even lines, the way the hand-written notes do."""
    words = title.split()
    mid = (len(words) + 1) // 2
    line1, line2 = " ".join(words[:mid]), " ".join(words[mid:])
    if not line2:
        return [line1 + ("." if not line1.endswith(".") else "")]
    if not line2.endswith("."):
        line2 += "."
    return [line1 + ",", line2]


def _inline(s):
    """Minimal inline markdown: **bold**, `code`, [text](url). Escapes first
    so markdown syntax can't smuggle in raw HTML."""
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    s = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', s)
    return s


def _md_to_body(src):
    """Turn a note's markdown body into the same list of pre-rendered HTML
    blocks the hand-written NOTES entries use (via p(), h2(), quote())."""
    blocks = []
    for raw in re.split(r"\n\s*\n", src.strip("\n")):
        raw = raw.strip()
        if not raw:
            continue
        if raw.startswith("## "):
            blocks.append(h2(_inline(raw[3:].strip())))
        elif raw.startswith(">"):
            lines = [l.lstrip("> ").strip() for l in raw.splitlines()]
            blocks.append(quote(*[_inline(l) for l in lines if l]))
        else:
            paras = [l.strip() for l in raw.splitlines() if l.strip()]
            blocks.append(p(*[_inline(x) for x in paras]))
    return blocks


def _load_file_note(path):
    """Parse a notes-src/YYYY-MM-DD-slug.md (or .html) file: a `---`-fenced
    `key: value` header, then the body. .md bodies run through _md_to_body();
    .html bodies are used as-is (already in the <p>/<h2> shape write_note()
    expects)."""
    text = path.read_text()
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"{path}: expected a --- fenced header block")
    _, header_text, body_text = parts
    meta = {}
    for line in header_text.strip("\n").splitlines():
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        meta[k.strip().lower()] = v.strip()

    m = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)", path.stem)
    default_date, default_slug = (m.group(1), m.group(2)) if m else (None, path.stem)
    date = meta.get("date", default_date)
    slug = meta.get("slug", default_slug)
    if not date or not slug:
        raise ValueError(f"{path}: could not determine date/slug")
    if meta.get("author", AUTHOR) not in AUTHORS:
        raise ValueError(f"{path}: unknown author {meta.get('author')!r}")

    og = ([x.strip() for x in meta["og"].split("|")] if meta.get("og")
          else _og_from_title(meta["title"]))
    body = ([body_text.strip("\n")] if path.suffix == ".html"
            else _md_to_body(body_text))

    return dict(
        slug=slug, title=meta["title"], date=date, pretty=_pretty_date(date),
        desc=meta["description"], stand=meta["stand"],
        author=meta.get("author", AUTHOR), og=og, faqs=[], body=body,
    )


def load_file_notes():
    """All notes/YYYY-MM-DD-slug.{md,html} in notes-src/, published ones only
    (today's date or earlier). A future-dated file stays unpublished: it is
    parsed (so an author sees errors early) but excluded from NOTES, so
    nothing on the built site links to it yet."""
    if not NOTES_SRC.exists():
        return []
    today = datetime.date.today().isoformat()
    stem_re = re.compile(r"^\d{4}-\d{2}-\d{2}-.+")
    found = sorted(NOTES_SRC.glob("*.md")) + sorted(NOTES_SRC.glob("*.html"))
    found = [p for p in found if stem_re.match(p.stem)]  # skips README.md etc.
    notes = [_load_file_note(p) for p in found]
    return [n for n in notes if n["date"] <= today]


NOTES += load_file_notes()


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
<meta name="author" content="{author_meta}">
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
<link rel="stylesheet" href="../../assets/css/studio.css?v=dots">
<link rel="stylesheet" href="../../assets/css/gravity.css">
<script async src="https://www.googletagmanager.com/gtag/js?id={ga}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  // Headless browsers and data-centre scanners were most of the recorded visitors in Sep 2026.
  if (!(navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || (screen.width === 800 && screen.height === 600))) {{
    gtag('js', new Date());
    gtag('config', '{ga}', {{ anonymize_ip: true }});
  }}
</script>
{ldjson}
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
{byline}
    <p class="stand">{stand}</p>

{body}

    <hr>
    <p class="when"><a href="../">All notes</a> &middot; <a href="../../">taktek.io</a></p>
  </article>

  <footer>
    <div class="entities"><address><b>Taktek, LLC</b><br>131 Continental Dr, Suite 305<br>Newark, DE 19713, United States</address><address><b>Taktek Offshore SAL</b><br>Al Watta Street, Riman Building<br>Aley 5516, Lebanon</address></div>
    <a href="../../portfolio/">Portfolio</a>
    <a href="../">Notes</a>
    <a href="../../terms/">Terms</a>
    <a href="../../privacy/">Privacy</a>
    <a href="../../support/">Support</a>
    <a href="../../stats/">Stats</a>
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
    author_key = n.get("author", AUTHOR)
    author = AUTHORS[author_key]
    article = json.dumps({
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": n["title"], "description": n["desc"],
        "datePublished": n["date"], "dateModified": n["date"], "inLanguage": "en",
        "url": url, "mainEntityOfPage": url,
        "image": f"{SITE}/assets/og/{n['slug']}.png",
        "author": author["ld"],
        "publisher": {"@type": "Organization", "name": "Taktek, LLC", "url": SITE + "/"},
    }, indent=2)
    scripts = [article]
    if n.get("faqs"):
        scripts.append(json.dumps({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": q,
                            "acceptedAnswer": {"@type": "Answer", "text": a}}
                           for q, a in n["faqs"]]}, indent=2))
    scripts.append(json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "taktek", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Notes", "item": SITE + "/notes/"},
            {"@type": "ListItem", "position": 3, "name": n["title"], "item": url}]}, indent=2))
    ldjson = "\n".join(f'<script type="application/ld+json">\n{s}\n</script>' for s in scripts)
    # Nizar's notes render no byline (unchanged output); any other author gets
    # one line crediting them, e.g. "By taktekbot, Taktek's founding agent".
    byline = "" if author_key == AUTHOR else f'    <p class="byline">By {author["meta"]}</p>\n'
    d = pathlib.Path("notes") / n["slug"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(HEAD.format(
        title=html.escape(n["title"]), desc=html.escape(n["desc"]), url=url, site=SITE,
        slug=n["slug"], date=n["date"], pretty=n["pretty"], author_meta=author["meta"], ga=GA,
        stand=n["stand"], body="\n\n".join(n["body"]), byline=byline,
        ldjson=ldjson))
    return d


def notes_index_ld(sorted_notes):
    return json.dumps({
        "@context": "https://schema.org", "@type": "Blog",
        "name": "taktek notes", "description": NOTES_DESC, "url": f"{SITE}/notes/",
        "publisher": {"@type": "Organization", "name": "Taktek, LLC", "url": SITE + "/"},
        "blogPost": [
            {"@type": "BlogPosting", "headline": n["title"],
             "url": f"{SITE}/notes/{n['slug']}/", "datePublished": n["date"],
             "description": n["desc"],
             "author": {k: AUTHORS[n.get("author", AUTHOR)]["ld"][k] for k in ("@type", "name")}}
            for n in sorted_notes
        ],
    }, indent=2)


NOTES_INDEX = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notes — taktek</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#F7F5F1" media="(prefers-color-scheme:light)">
<meta name="theme-color" content="#0D0D0E" media="(prefers-color-scheme:dark)">
<link rel="canonical" href="{site}/notes/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:url" content="{site}/notes/">
<meta property="og:site_name" content="taktek">
<meta property="og:title" content="Notes — taktek">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{site}/assets/og/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{site}/assets/og/og.png">
<link rel="icon" href="../assets/logos/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/og/apple-touch.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/studio.css?v=dots">
<link rel="stylesheet" href="../assets/css/gravity.css">
<script type="application/ld+json">
{ld}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id={ga}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  // Headless browsers and data-centre scanners were most of the recorded visitors in Sep 2026.
  if (!(navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || (screen.width === 800 && screen.height === 600))) {{
    gtag('js', new Date());
    gtag('config', '{ga}', {{ anonymize_ip: true }});
  }}
</script>
</head>
<body>

<div class="wrap">
  <header class="head">
    <a class="mark" href="../">taktek<i aria-hidden="true"></i></a>
    <input type="checkbox" id="mode">
    <label class="modebtn" for="mode" title="Switch appearance" aria-label="Switch appearance">
      <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
      <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
    </label>
  </header>

<main>
  <section class="hero">
    <p class="eyebrow">Notes</p>
    <h1>Notes from<br>the fleet<em>.</em></h1>
  </section>

  <section class="index" aria-label="Notes">
{rows}
    </section>

  <footer>
    <div class="entities"><address><b>Taktek, LLC</b><br>131 Continental Dr, Suite 305<br>Newark, DE 19713, United States</address><address><b>Taktek Offshore SAL</b><br>Al Watta Street, Riman Building<br>Aley 5516, Lebanon</address></div>
    <a href="../">taktek.io</a>
    <a href="../portfolio/">Portfolio</a>
    <a href="../terms/">Terms</a>
    <a href="../privacy/">Privacy</a>
    <a href="../support/">Support</a>
    <a href="../stats/">Stats</a>
    <a class="spacer" href="https://github.com/taktekhq">github.com/taktekhq</a>
  </footer>
</main>
</div>

<script src="../assets/js/gravity.js"></script>
</body>
</html>
"""


def write_notes_index(sorted_notes):
    n = len(sorted_notes)
    rows = "\n".join(
        f'      <a class="row" href="{note["slug"]}/">\n'
        f'        <span class="row__n">{n - i:02d}</span>\n'
        f'        <span class="row__title">{html.escape(note["title"])}</span>\n'
        f'        <span class="row__when">{_short_date(note["date"])}</span>\n'
        f'      </a>'
        for i, note in enumerate(sorted_notes)
    )
    path = pathlib.Path("notes/index.html")
    path.write_text(NOTES_INDEX.format(
        desc=NOTES_DESC, site=SITE, ga=GA,
        ld=notes_index_ld(sorted_notes), rows=rows))
    return path


def update_sitemap(sorted_notes):
    """Patch only the note-related <url> entries; everything else (home,
    portfolio, bloo, privacy, terms, support) is hand-maintained and left
    untouched, in place."""
    path = pathlib.Path("sitemap.xml")
    text = path.read_text()
    lines = text.splitlines()
    note_prefix = f"{SITE}/notes/"
    kept = [l for l in lines if f"<loc>{note_prefix}" not in l]
    latest = max(n["date"] for n in sorted_notes) if sorted_notes else None
    note_lines = []
    if latest:
        note_lines.append(f'  <url><loc>{note_prefix}</loc><lastmod>{latest}</lastmod></url>')
    for note in sorted_notes:
        note_lines.append(
            f'  <url><loc>{note_prefix}{note["slug"]}/</loc><lastmod>{note["date"]}</lastmod></url>')
    # insert the notes block right after the portfolio entry if present,
    # else right after the opening <urlset> tag.
    anchor = next((i for i, l in enumerate(kept) if "/portfolio/" in l), 0)
    out = kept[:anchor + 1] + note_lines + kept[anchor + 1:]
    path.write_text("\n".join(out) + "\n")
    return path


def update_llms_txt(sorted_notes):
    """llms.txt opens with hand-curated prose (claims, portfolio blurbs) that
    this script does not touch. The one mechanical part, the `- [title](url):
    desc` list under "## Notes", is regenerated here so a new note (bot or
    Nizar's) shows up without a manual edit."""
    path = pathlib.Path("llms.txt")
    if not path.exists():
        return None
    text = path.read_text()
    m = re.search(r"(?ms)^(- \[.+?\]\(https://taktek\.io/notes/.+?\n)+", text)
    if not m:
        return None
    block = "\n".join(
        f"- [{note['title']}]({SITE}/notes/{note['slug']}/): {note['desc']}"
        for note in sorted_notes
    ) + "\n"
    path.write_text(text[:m.start()] + block + text[m.end():])
    return path


if __name__ == "__main__":
    for n in NOTES:
        d = write_note(n)
        print(f"{d}/index.html  {(d/'index.html').stat().st_size:,} bytes")
    sorted_notes = sorted(NOTES, key=lambda n: n["date"], reverse=True)
    p1 = write_notes_index(sorted_notes)
    print(f"{p1}  {p1.stat().st_size:,} bytes")
    p2 = update_sitemap(sorted_notes)
    print(f"{p2}  updated, {len(sorted_notes)} notes")
    p3 = update_llms_txt(sorted_notes)
    if p3:
        print(f"{p3}  notes list updated")
