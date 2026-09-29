#!/usr/bin/env python3
"""Render the share cards.

Rendered as HTML rather than a bare SVG, because a standalone SVG opened over
file:// has no access to the Google Fonts the site loads, so every card came out
in the system sans instead of Space Grotesk. The fonts are local now and
declared with @font-face, and the page does not signal ready until
document.fonts.ready resolves, so Chrome cannot screenshot a fallback.

  python3 build-og.py
"""
import html, pathlib, subprocess
import importlib.util as _il

_s = _il.spec_from_file_location("bn", "build-notes.py")
_bn = _il.module_from_spec(_s); _s.loader.exec_module(_bn)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = pathlib.Path("assets/og")
FONTS = pathlib.Path("assets/fonts").resolve()
PAPER, INK, MUTED, SIGNAL = "#F7F5F1", "#0D0D0E", "#6B6B70", "#00A862"

CARDS = [("og", ["An agent", "studio."], "taktek.io", 78)] + [
    (n["slug"], n["og"], "taktek.io/notes", 54) for n in _bn.NOTES
]

PAGE = """<!doctype html><meta charset="utf-8">
<style>
@font-face {{ font-family: "SG"; src: url("file://{fonts}/SpaceGrotesk.woff2") format("woff2");
             font-weight: 100 900; font-display: block; }}
@font-face {{ font-family: "JB"; src: url("file://{fonts}/JetBrainsMono.woff2") format("woff2");
             font-weight: 100 900; font-display: block; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1200px; height: 630px; overflow: hidden; }}
body {{ background: {paper}; position: relative; }}
.mark {{ position: absolute; left: 88px; top: 96px; display: flex; align-items: center; gap: 9px;
        font-family: "JB"; font-size: 27px; font-weight: 700; letter-spacing: -1.2px; color: {ink}; }}
.mark i {{ display: block; width: 11px; height: 22px; background: {signal}; }}
h1 {{ position: absolute; left: 88px; top: {top}px; font-family: "SG"; font-weight: 500;
     font-size: {size}px; line-height: 1.06; letter-spacing: -{track}px; color: {ink}; }}
.foot {{ position: absolute; left: 88px; top: 530px; font-family: "JB"; font-size: 21px; color: {muted}; }}
.rule {{ position: absolute; left: 0; bottom: 0; width: 1200px; height: 24px; background: {ink}; }}
</style>
<div class="mark">taktek<i></i></div>
<h1>{lines}</h1>
<div class="foot">{foot}</div>
<div class="rule"></div>
<script>
  document.fonts.ready.then(function () {{ document.title = "ready"; }});
</script>
"""

if not pathlib.Path(CHROME).exists():
    raise SystemExit("Chrome not found; cannot rasterise.")

OUT.mkdir(parents=True, exist_ok=True)
for name, lines, foot, size in CARDS:
    top = 300 if len(lines) > 1 else 340
    page = OUT / f"_{name}.html"
    page.write_text(PAGE.format(
        fonts=FONTS, paper=PAPER, ink=INK, muted=MUTED, signal=SIGNAL,
        size=size, track=round(size * 0.045, 1), top=top,
        lines="<br>".join(html.escape(l) for l in lines), foot=html.escape(foot)))
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", "--virtual-time-budget=5000",
                    "--default-background-color=00000000",
                    f"--screenshot={OUT/name}.png", "--window-size=1200,630",
                    f"file://{page.resolve()}"], capture_output=True)
    page.unlink()
    for junk in (OUT / f"{name}.svg",):
        if junk.exists(): junk.unlink()
    print(f"{name}.png  {(OUT/(name+'.png')).stat().st_size:,} bytes")
