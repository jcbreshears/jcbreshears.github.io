# jcbreshears.github.io

Justin Breshears — portfolio. Live at <https://jcbreshears.github.io/>.

Plain HTML, CSS and JavaScript. **The site itself has no build step**: the three
files at the root are what gets served. Push to `main` and GitHub Pages
publishes it.

## Files

| Path | What it is |
|---|---|
| `index.html` | All markup and copy |
| `styles.css` | All styling, tokenised (see below) |
| `script.js` | ~12 KB, no dependencies, entirely progressive enhancement |
| `assets/fonts/` | Self-hosted Instrument Serif + Inter (latin subsets) |
| `assets/work/` | Project previews, AVIF + WebP at 1520w and 760w |
| `assets/og.png` | Link-preview card for when the URL is shared |
| `tools/refresh-shots.mjs` | Re-shoots the project previews |

## Local preview

```bash
npm run serve      # http://127.0.0.1:8099
```

Or just open `index.html` — everything is relative and same-origin.

## Refreshing the project previews

When a client site changes, re-shoot it. `index.html` never needs editing;
it references the previews through `<picture>`/`srcset`.

```bash
npm install        # once — playwright + sharp, dev only
npm run shots                     # all six
npm run shots -- heirloom skeg    # just these
```

A site that fails to load leaves its existing preview in place rather than
blanking it.

## How it's put together

**Tokens.** Motion is two curves and four durations; type is one fluid
`clamp()` ladder (`--step--2` … `--step-7`). Nothing has a bespoke transition
or a hard-coded font size.

**Colour rooms.** Sections re-declare `--bg`/`--fg`/`--accent` rather than
components overriding themselves. The accent resolves to a *different hex* per
room: `#8A9461` on the navy ground (5.37:1 on `--bg`, 4.88:1 on `--bg-raise`),
`#5C6438` on cream (5.62:1 / 5.05:1). The brand olive `#6B7545` is deliberately
**not** used as text on cream — it only reaches 4.38:1 and fails AA. Change one
room's accent without re-measuring the other and the page stops passing.

**Motion is additive.** Every animation lives inside
`@media (prefers-reduced-motion: no-preference)`. The resting layout, the
reduced-motion layout and the no-JS layout are the same layout — there is
nothing to "switch off".

**The headline split** ships two copies: one intact and visually hidden for
assistive tech, copy/paste and find-in-page; one split into per-word spans and
`aria-hidden`. The splitter walks text nodes only, so the accented word
survives. If it throws, the original markup is restored. An inline head script
carries a 1.2s dead-man's switch so the headline can never stay invisible.

**Fallback font metrics are computed, not copied.** `size-adjust` and the
ascent/descent/line-gap overrides in `styles.css` were derived from the real
`.woff2` files — average advance width weighted by English letter frequency,
measured against Arial, with the overrides divided by the size-adjust ratio.
Cross-check: the same method puts Inter at 107.47% against `next/font`'s
published 107.12%. **Regenerate them if a font file changes; never hand-tune.**

**The measurement panel is real.** It reads `largest-contentful-paint`,
`layout-shift` and the resource timings out of the visitor's own browser. The
observers are registered in the `<head>`, before anything renders, because
registering them from the deferred script can miss entries.

## Measured

Local, warm renderer; and throttled to 200 KB/s at 150 ms RTT — the condition a
font swap is actually visible in.

| | Local | Throttled | Target |
|---|---|---|---|
| FCP / LCP | 52 ms | 1,116 ms | < 2,500 ms |
| CLS | 0 | 0.00035 | < 0.1 |
| Requests | 11 | | |
| Third-party requests | **0** | | |
| JavaScript | 12.2 KB | | < 50 KB |
| Total transferred | 193 KB | | |

Contrast: **every text style passes WCAG AA** (41/41 on the last sweep; the
count varies with which hover/active states are live at capture). Swept against
composited backgrounds rather than declared token pairs.
