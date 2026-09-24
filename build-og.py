#!/usr/bin/env python3
"""Render the share cards.

The site had no og:image at all, so anything linking to it showed a bare URL.
One card for the studio, one per note.

  python3 build-og.py
"""
import html, pathlib, subprocess

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = pathlib.Path("assets/og")
PAPER, INK, MUTED, SIGNAL = "#F7F5F1", "#0D0D0E", "#6B6B70", "#00A862"
DISPLAY = "Space Grotesk, Inter, -apple-system, Helvetica, sans-serif"
MONO = "JetBrains Mono, ui-monospace, Menlo, monospace"

import importlib.util as _il
_s = _il.spec_from_file_location("bn", "build-notes.py")
_bn = _il.module_from_spec(_s); _s.loader.exec_module(_bn)

CARDS = [("og", ["An agent", "studio."], "taktek.io", 78)] + [
    (n["slug"], n["og"], "taktek.io/notes", 54) for n in _bn.NOTES
]


def svg(lines, foot, size):
    y = 300 if len(lines) > 1 else 340
    heads = "".join(
        f'<text x="88" y="{y + i*(size+14)}" font-family="{DISPLAY}" font-size="{size}" '
        f'font-weight="500" letter-spacing="-{size*0.045:.1f}" fill="{INK}">{html.escape(t)}</text>'
        for i, t in enumerate(lines))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="{PAPER}"/>
  <text x="88" y="128" font-family="{MONO}" font-size="26" font-weight="700" letter-spacing="-1.1" fill="{INK}">taktek</text>
  <rect x="192" y="110" width="11" height="21" fill="{SIGNAL}"/>
  {heads}
  <text x="88" y="556" font-family="{MONO}" font-size="21" fill="{MUTED}">{html.escape(foot)}</text>
  <rect x="0" y="606" width="1200" height="24" fill="{INK}"/>
</svg>'''


if not pathlib.Path(CHROME).exists():
    raise SystemExit("Chrome not found; cannot rasterise.")

OUT.mkdir(parents=True, exist_ok=True)
for name, lines, foot, size in CARDS:
    s = OUT / f"{name}.svg"
    s.write_text(svg(lines, foot, size))
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", f"--screenshot={OUT/name}.png",
                    "--window-size=1200,630", f"file://{s.resolve()}"],
                   capture_output=True)
    print(f"{name}.png  {(OUT/(name+'.png')).stat().st_size:,} bytes")
