# Handoff — 2026-10-07

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
independent framing/zoom/locks/cuts, direct cut adjustment, thumbnail reorder,
Undo/Redo/reset, local session restore, PNG/ZIP export, and capability-gated single
or multi-file sharing. PDFs are rendered locally with a restricted-environment fallback.

## Known limits / decisions

- Outputs: 1080×1350, 1080×1080, 1080×1920. Per-highlight zoom: 100–150%.
- PDF import: 50 MB, up to 20 consecutive pages, target 1080px source width,
  minimum 540px, at most 16,000px height and roughly 12.6 million pixels. Long
  imports reduce resolution. Scans remain pixels; there is no OCR.
- Capture relies on Microlink; some assets/sites/paywalls cannot be captured.
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

Verified locally: syntax check, all nine current browser suites (including
Chromium/WebKit PDF loader restrictions), and both screenshot scripts. GitHub
Actions/Pages still require configuring and running against your own repository.

The ZIP contains no node_modules, .git metadata, credentials, uploaded personal
files or generated validation artifacts. No remote is configured and nothing has
been pushed. No application-code license was chosen on your behalf.

Also verified: the PDF bundle regeneration is repeatable (two builds produce the
same bytes), and the regenerated artifact passes the real PDF browser suite. The
committed app was not replaced during this check.
