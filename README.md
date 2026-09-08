# taktekhq.github.io

The Taktek landing page, served at [taktek.io](https://taktek.io).

## Structure

    index.html              the landing page
    assets/css/taktek.css   design system tokens and base styles
    assets/fonts/           Grobold, SF Pro Text, SF Pro Rounded
    assets/icons/           product icons
    assets/logos/           product wordmarks

The page is static and strictly HTML/CSS — no JavaScript, no build step.
Dark mode follows the OS through `prefers-color-scheme`, with a CSS-only
toggle in the header to override it.

## Development

`assets/css/taktek.css` is generated from the Taktek design system project
by concatenating its token closure, with font URLs rewritten to `../fonts/`.
Do not hand-edit it — change the tokens upstream and re-export.

Page-specific styles live in the `<style>` block in `index.html`. A few
colours are pinned there rather than tokenised, because the product cards
set their own tints and the theme scopes were never measured against those
grounds; the comments in the design system export explain each one.
