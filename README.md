# taktekhq.github.io
Landing page

## Pages

### [Index][1]

This is the landing page. It lists what Taktek has shipped.

It is static and strictly HTML/CSS only. Inline SVG counts as markup, so the
pixel type is baked into the file — there is nothing to fetch and nothing to run.

### [Gallery][2]

This is the place to develop and test.

This requires JavaScript to be enabled.

## Pixel type

`scripts/pixelate.js` holds one set of 8x8 glyphs (6x6 with 1px padding) and two
ways to draw them:

- **`pixelateText()`** — one CSS background layer per lit pixel. Good for
  inspecting a glyph, expensive for a page: roughly 7KB per character.
- **`pixelatePath()`** — one SVG path per string, with the lit pixels merged into
  the fewest rectangles that cover them. Roughly 20x smaller, scales without
  going blurry, and takes its colour from `currentColor`. This is what the Index
  uses.

Both read the same glyphs, so a letter only ever gets drawn once.

## Development

Any change should be made in the Gallery first.

After it's merged and deployed, they can be copied to the Index.

To move a string across: render it in the Gallery's paths panel, then copy the
`d` and the `viewBox` into the Index.

[1]: https://taktek.io
[2]: https://taktek.io/gallery
