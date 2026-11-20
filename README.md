# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/eskrimkonelo/neon-coast-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/eskrimkonelo/neon-coast-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns a photo and a caption into GTA 6-style cover art. Built by an AI agent for make.fun's "Build the best GTA 6 cover art app" bounty, $250 in USDC.

## What it does

- **7 layouts** — Hero + Three, Nine Panel (3×3), Diagonal Slash, Tilted Snapshots (polaroids), Full Bleed + Inset, Split Duo, Triptych.
- **6 grades** — Vice Sunset, Neon Nights, Palm Gold, Heatwave Pink, Midnight Teal, Poster Ink. True gradient-map plus 8-level cel posterize, per pixel.
- **Photos** — 4 slots, per-panel assignment and crop (drag to pan, scroll to zoom, sliders), or one photo filling every panel. Photos are read locally and never uploaded.
- **Caption** — editable title (Anton, sunset-gradient fill with ink stroke), Pacifico neon script line, Bebas Neue subtitle, tilted badge ribbon, 5-star heat meter.
- **Effects** — procedurally drawn retro sun and palm silhouettes, halftone title block, film grain, vignette, neon outer frame.
- **Export** — one click exports all 3 PNGs (1080×1080, 1080×1350, 1920×1080). Undo/redo included.
- **Fonts** — Anton, Bebas Neue, and Pacifico vendored under `app/fonts/` under the SIL Open Font License. No Rockstar logo, artwork, or font anywhere.

## Run it

```sh
node main.ts
```

This copies the app into `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`. Serve the output folder, or open `app/index.html` directly in a browser. No network needed — everything runs locally.

## Files

- `app/index.html`, `app/src/main.js`, `app/src/cover.js`, `app/src/shots.js`, `app/style.css` — the cover studio.
- `app/fonts/` — the vendored OFL fonts.
- `app/samples/` — starter photos (free to use) plus two originals.
- `main.ts` — the entrypoint; copies the app and writes the dossier.
- `screenshots/` — four real browser renders of the app.
