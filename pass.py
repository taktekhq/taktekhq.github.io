#!/usr/bin/env python3
"""Run the house-style pass over the legal pages with Gemini.

These are hand-written HTML rather than generated, so this works on the files:
every paragraph inside the doc is a unit, the model rewrites it, and it is
spliced back into the exact span it came from. Headings are held back, because
they are the document's structure rather than its prose.

Three guards, and a unit that fails any of them keeps its original. Numbers and
inline markup, as everywhere else on this project, plus first person, because
these documents are published by Taktek and describe work done by Hobeich
Legal. "We do the law" is the sentence that must never appear, and the model
produced exactly that the first time it was asked.

  GEMINI_API_KEY=... python3 pass.py
  GEMINI_API_KEY=... python3 pass.py --dry-run
"""
import pathlib, re, sys

sys.path.insert(0, str(pathlib.Path("../hobeichlegal").resolve()))
import rewrite as R

PAGES = ["terms/index.html", "privacy/index.html", "support/index.html"]
UNIT = re.compile(r"(<p>)(.*?)(</p>)", re.S)

SYSTEM = R.SYSTEM + """

These are legal notices for a studio, not marketing. Extra rules:
- Say exactly what the source says. Do not add or remove an obligation, a
  right, a period, a number or an exception.
- Never write we, us, our or ours. Two companies appear in these documents:
  Taktek, LLC publishes them, Hobeich Legal does the legal work described in
  some of them. Name whichever one you mean, every time.
- Keep every link and its text. Keep &middot; and &rarr; entities as they are.
"""


def units(html):
    doc = html[html.index('class="doc"'):html.index("</section>")]
    return [(m.start() + html.index('class="doc"'), m.end() + html.index('class="doc"'),
             m.group(2)) for m in UNIT.finditer(doc)]


def main():
    dry = "--dry-run" in sys.argv
    R.SYSTEM = SYSTEM
    for page in PAGES:
        p = pathlib.Path(page)
        html = p.read_text()
        us = units(html)
        texts = [re.sub(r"\s+", " ", t).strip() for _s, _e, t in us]
        print(f"{page}: {len(texts)} paragraphs, {sum(map(len, texts))} chars")
        if dry:
            continue
        listing = "\n".join(f"[{i}] {t}" for i, t in enumerate(texts))
        prompt = (
            f"Rewrite each of these {len(texts)} paragraphs in the house style. "
            f"Keep the meaning exactly. Return all {len(texts)}.\n\n"
            f"CHECK BEFORE ANSWERING: the words we, us, our and ours must not "
            f"appear anywhere in your output. Search your answer for them and "
            f"rewrite any sentence containing one.\n\n{listing}")
        got = {u["i"]: u["text"].strip() for u in R.gemini(prompt, temperature=0.3)["units"]}

        kept, failed = {}, []
        for i, before in enumerate(texts):
            after = got.get(i)
            if after is None:
                continue
            hard, _soft = R.check(before, after)
            # Case sensitive on purpose: "US dollars" is not first person.
            fp = re.findall(r"\b(we|We|us|Us|our|Our|ours|Ours)\b", after)
            if fp:
                hard = hard + [f"first person {sorted(set(w.lower() for w in fp))}"]
            if len(after) > len(before) * 1.25:
                hard = hard + ["grew past a quarter"]
            if hard:
                failed.append((i, hard, before, after)); continue
            if after != before:
                kept[i] = after
        for i, hard, b, a in failed[:6]:
            print(f"  ! [{i}] {'; '.join(hard)}")
            print(f"      was: {b[:100]}")
            print(f"      now: {a[:100]}")
        out, prev = [], 0
        for i, (s, e, _t) in enumerate(us):
            out.append(html[prev:s])
            out.append(f"<p>{kept[i]}</p>" if i in kept else html[s:e])
            prev = e
        out.append(html[prev:])
        p.write_text("".join(out))
        print(f"  {len(kept)} rewritten, {len(failed)} rejected")


if __name__ == "__main__":
    main()
