# Handoff — 2026-10-08

## Current, approved interaction

- One focused editor on desktop and mobile. The Source viewport and Source/Edit
  tabs were removed; keep the immutable original image behind the scenes.
- `＋ Add highlight` lives in the thumbnail strip under **Highlights**. A mobile
  bottom-dock shortcut performs the same action.
- Add immediately appends/selects a new highlight beginning at the bottom of the
  current selected excerpt, taking cuts and zoom into account. There is no Add
  draft, mandatory source tap, or Add-to-carousel confirmation. Undo removes it.
- The last frame is clamped when there isn't enough source remaining, with an
  end-of-source notice.
- **Settings is in the carousel header**, not in the individual highlight controls.
- Preserve original publisher/PDF styling. No text-scraping modes.

## Working capabilities

URL screenshot capture (540px default), image/PDF imports, all three output ratios,
independent 1–150% framing/zoom/locks/cuts, direct cut adjustment, source-anchored
color/size marker strokes, thumbnail reorder, Undo/Redo/reset, local session restore, PNG/ZIP
export, and capability-gated single or multi-file sharing. PDFs are rendered locally with a restricted-environment fallback.

## Known limits / decisions

- Outputs: 1080×1350, 1080×1080, 1080×1920. Per-highlight zoom: 1–150%, with
  25/50/100/150% presets and Fit source (may go below 25% for long captures).
- PDF import: 50 MB, up to 20 consecutive pages, target 1080px source width,
  minimum 540px, at most 16,000px height and roughly 12.6 million pixels. Long
  imports reduce resolution. Scans remain pixels; there is no OCR.
- Capture relies on Microlink; some assets/sites/paywalls cannot be captured. URL capture
  can copy a detected publisher logo into Article-only captures and hide share widgets.
  Menus and dialogs are not automatically dismissed; close them on the source page or
  use a browser screenshot upload when they should not appear.
- Native sharing support/order varies by browser and destination. It does not
  directly post to Instagram. The PNG/ZIP fallback remains important.
- Sessions are browser/origin-local convenience saves, not portable backups.
- No recruited user study or physical-device share-picker validation is claimed.
- Old Source/Add-draft screenshots and historical walkthrough scripts are excluded
  from this clean repository handoff because they no longer describe the UI.

## This packaging pass

Application `index.html` was kept byte-for-byte unchanged. Added pinned development
packages, a lockfile, Git hygiene, a portable dev/test server, isolated test runner,
CI, optional manual Pages deployment, and documentation. Test URLs/output paths
were made configurable; browser-test assertions were preserved.

During the initial packaging pass, before the feature updates below, the syntax
check, then-current nine-suite browser run (including Chromium/WebKit PDF-loader
restrictions), and both screenshot scripts passed. The newer browser suites could
not be launched in this sandbox, as noted in the feature update below. GitHub
Actions/Pages still require configuring and running against your own repository.

The ZIP contains no node_modules, .git metadata, credentials, uploaded personal
files or generated validation artifacts. No remote is configured and nothing has
been pushed. No application-code license was chosen on your behalf.

Also verified: the PDF bundle regeneration is repeatable (two builds produce the
same bytes), and the regenerated artifact passes the real PDF browser suite. The
committed app was not replaced during this check.

## Feature update — 2026-10-08

The focused editor supports translucent freehand marker strokes, individually styled
by color and brush width. Strokes use original-source coordinates, follow the image
through framing/cuts, render in thumbnails/previews/PNG/ZIP, and persist locally. The
highlighter offers yellow, pink, mint and blue, 12–64px brush widths (28px default),
per-stroke undo, plus the existing clear and history undo/redo controls. Old yellow
strokes without an explicit color remain compatible.

Zoom ranges from 1% to 150%, with 25/50/100/150% presets and Fit source. Fit centers
the complete source/cut layout and automatically goes below 25% for long captures;
1% is the minimum. A subtle dashed screenshot boundary is a separate DOM overlay in
the editor only, so it does not enter preview canvas pixels, thumbnails or exports.
Browser coverage was extended for long-source Fit, presets, marker style persistence,
phone-sized zoom and touch drawing. Export review was not added. `npm run check` passes.
The targeted browser suite cannot start in this sandbox because Playwright's Chromium
executable is absent; an earlier browser download attempt was blocked by the network. Run
`npx playwright install chromium` in a network-enabled development environment, then
`npm test`.

The active suite count remains nine Chromium suites (ten including PDF loader checks).
