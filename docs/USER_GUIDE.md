# NewsGram — frame the highlights

A pixel-based, single-file static tool for making Instagram carousels from selected
article excerpts, screenshots and PDFs. Capture a webpage or open a file, then edit
individual highlights in a **large, focused editor**. No text scraping, recreated
cards, application backend or deployment build step. PDF.js and its rendering assets
are bundled inside the HTML; no CDN or extra runtime files are needed.

## Workflow
1. Paste a public article link and **Capture article**, or use **Upload image / PDF**.
   Webpage appearance and Instagram shape settings come before capture. The default
   is a 540px webpage and a 4:5 (1080 × 1350) output frame.
2. The first highlight opens directly in the editor. **Drag to pan**, scroll to move
   up/down, or use Position and its nudges. Zoom each highlight from **1–150%** with
   the slider or **25%, 50%, 100%, 150%** presets. Below 100%, the screenshot shrinks
   and the white canvas shows around it. **Fit source** centers the complete capture
   (including its cut layout), automatically going below 25% for long captures; 1% is
   the minimum, so an exceptionally long source may still not fit all at once. A subtle
   dashed boundary appears in the editor when white margins are visible, but never in
   previews, thumbnails or exported images.
3. The **Highlights** section contains the thumbnail strip and the **＋ Add highlight**
   tile. Clicking it immediately appends and selects a new highlight starting at the
   bottom of the current selected excerpt, accounting for its zoom and cuts.
   There is no separate Source view, selection draft, or confirmation step.
4. Tap **🖍 Mark text**, choose yellow, pink, mint or blue and set the marker size
   (12–64 source pixels, default 28), then drag across screenshot text. Each stroke
   keeps its own color and size, stays anchored to the source image and appears in
   previews, thumbnails, saved sessions and PNG/ZIP exports. **Undo stroke** removes
   just the latest mark; the main Undo/Redo and **Clear marks** are also available.
5. Adjust the new frame in the same editor. **Undo** removes an accidental addition;
   **Redo** restores it. Existing highlights never get reframed by Add. New highlights
   start at 100% zoom with no cuts; **Duplicate** is for an exact independent copy.
6. At the end, Add starts at the last position that can fill a frame and says
   **“End reached—adjust upward if needed.”** Very short originals are padded white.
   Up to 20 highlights are supported; Add is disabled at the limit.
7. Select a thumbnail to edit that highlight. Drag the **⠿ handles** to reorder,
   or focus a handle and press the ← / → arrow keys. Export follows that order.
8. Download a PNG, share supported files, or download the entire carousel as ZIP.

**Settings** lives in the carousel header, not among the individual-highlight
controls. It reopens capture settings and output ratios. The original bitmap stays
untouched behind the scenes for framing, cuts, marker strokes, undo and session saving.

## PDF upload — continuous source
1. Choose **Upload image / PDF**, select a PDF, and confirm replacement if you already
   have a source open. Existing work stays in place until the entire import succeeds.
2. The import dialog shows the page count. Import all pages (up to 20 at once), or
   select a consecutive **From page / To page** range. Documents with more than 20
   pages default to the first 20; the range is explicit before you import.
3. Pages are rendered locally and joined vertically **without added gaps**. Their
   own margins remain. Different page sizes are scaled to the same source width;
   embedded rotations are honored. Scanned pages remain images—no OCR/text extraction.
4. Frame the document directly in the editor using drag, scroll and Position.
   Page metadata remains saved, but there is no separate PDF/source viewport.
5. Use the same one-tap **Add highlight**, framing, 1–150% zoom presets and Fit source,
   color/size highlighter, cuts, direct cut adjustment, reorder, Undo/Redo and PNG/carousel
   export tools. A highlight can span a page boundary; remove unwanted margins with the normal cut tool.

### PDF privacy, compatibility and limits
- **Local processing:** PDF.js 5.4.624 and its worker are embedded as classic-script factories; standard
  fonts, CMaps and image decoders are compressed inside `index.html` (about 4.2 MB
  total). They initialize lazily when needed, without `import(blob:...)` or eval. PDF uploads make no request to Microlink or a CDN. The HTML can render
  PDFs offline after loading. A classic worker is used where permitted. If a browser or sandbox blocks workers,
  rendering falls back to the page without importing a module. Large PDFs can be
  less responsive in that fallback. Use the live app on a recent Safari, Chrome or
  Firefox for normal downloads and storage; restricted previews may block those.
- Password-protected files prompt locally for a password. It stays in memory only
  and is cleared after use. Cancelling, a wrong/unknown password, an invalid document
  or a render failure cannot replace current highlights with a partial source.
- The saved session contains the **flattened PNG and page-boundary metadata**, not
  original PDF bytes or passwords. Reload restores editing without parsing the PDF
  again. Normal IndexedDB privacy/quota limitations still apply. Start over clears it.
- Maximum input size **50 MB**, maximum **20 consecutive pages per import**. The
  source targets **1080px wide**, automatically reducing width for longer documents
  while remaining at least 540px wide. Canvas height is capped at 16,000px and area
  at roughly 12.6 million pixels. Too-tall ranges are rejected rather than silently
  dropping pages. Split the document or import fewer pages for sharper text.
- Progress and Cancel remain available during import. These limits reduce memory
  pressure but cannot guarantee every complex PDF will fit every phone. Large
  embedded images, font issues or malformed files may still fail.
- PDFs become static pixels: no live links, PDF JavaScript, form editing or embedded
  attachments. Dynamic XFA forms are not supported; print them to a standard PDF.
  Print-oriented color profiles can differ from a dedicated color-managed viewer.
  Review the resulting page appearance and excerpt boundaries before posting.
- Webpage capture settings do not alter PDFs. Instagram ratios still control output
  frames, not the PDF's original page geometry.

## Mobile workspace
The app uses one editor on both desktop and mobile—no Source/Edit tabs. On screens
up to 700px wide, and touch/coarse-pointer screens up to 1000px, shared Position/Zoom
controls move into a bottom dock above **Add highlight · Cut · Mark · Undo / Redo · Export**.
The **＋ Add highlight** tile remains in **Highlights** too; both entry points perform
the same immediate addition. Settings stays in the carousel header.

- The highlight label stays in the editor header; framing sliders move into the bottom dock.
  The dock also includes **🖍 Mark** for quick access to the highlighter.
- Pinch to zoom keeps the point between your fingers anchored where bounds allow.
  One-finger drag pans; the dock keeps the zoom slider, presets and Fit source available.
  Fit can go below 25% for long captures (down to 1%); white canvas and its editor-only
  dashed source boundary remain outside exported pixels. Touch drawing uses the selected
  marker color/size, and Undo stroke is available in the highlighter options. Each framing
  gesture is one undo step.
- Lock framing protects the selected highlight. Adding another highlight still works
  and does not change the locked one. Global ratio changes still apply to all frames.
- Cutting opens a focused screen with large handles, sliders, Cancel/Save actions
  and a 2× edge magnifier. Landscape uses the preview left and controls right.
- Undo/Redo are visible in the dock. Add, cut and delete also show a brief Undo notice.
- Rotation keeps the editor and framing state rather than switching to another view.

### Share from your phone
Open **Export** and choose **This image** or **Entire carousel**. The dialog prepares
PNG Files before enabling Share, retaining browser user activation. Carousel files
are numbered in posting order. Multi-file sharing is offered only if
`navigator.canShare({files})` accepts the entire array, not merely one file.

- **Share selected PNG / Share all N images** opens the system share sheet. It does
  not post to Instagram itself. Check order and supported file counts in your chosen
  destination: numbering cannot force an external app to preserve selection order.
- When sharing is unsupported or blocked, save numbered PNGs **one per deliberate
  tap**. The next filename advances after each download; there is no automatic
  multi-download burst. Files may land in Downloads/Files rather than Photos.
- **Download entire carousel as ZIP** is always an alternative. Desktop also has
  **Export**, the individual PNG button and Download ZIP.
- Cancelling native sharing neither downloads files nor changes the carousel.
  Changing scope or closing the dialog invalidates any unfinished preparation.

Sharing depends on browser, permissions, OS and destination app. Use the live site
outside a restricted iframe if needed. Automated tests use share-API mocks; no claim
is made that a physical iOS/Android picker or Instagram posting flow was tested.

## Cut unwanted sections
1. Select a highlight, then tap **Cut** in the mobile bottom bar or **✂ Cut section**
   beside Reset framing on desktop. Unlock framing first if it is locked.
2. Drag a horizontal band over the unwanted content. Move the **Top / Bottom**
   handles to refine the edges, or use the two sliders (output-pixel coordinates).
   Drag inside the shaded band to move it as a unit. Handle arrow keys adjust the
   edge; Shift makes one-pixel adjustments. Works with mouse and touch.
3. Leave **Show “…” at joins** on to indicate omissions, or turn it off for a seamless
   join. This choice applies to all joins in that highlight.
4. Tap **Remove section**. Content below moves up and the Instagram dimensions stay
   fixed. If there is not enough remaining content, the bottom is padded white.
   **Cancel** or Escape discards the pending selection without changing the image.
5. **N sections cut · Edit → Adjust** directly reopens a saved cut. A clearly labeled
   temporary view shows its **original content**, with enough space for the whole
   interval even when a merged cut is longer than one output frame. Change its edges
   and **Save adjustment**, or **Cancel** to return to the exact committed pixels.
   Other cuts stay intact (overlapping/adjacent intervals still merge). The editor
   preserves its original-content top anchor; restored content above it is available
   by panning upward. Framing must be unlocked to adjust.
6. **Undo / Redo** reverses/reapplies an adjustment as one edit. The manager also
   supports Restore one, Restore all and changing the exported omission dividers.

Cuts are full-width horizontal sections in the selected highlight only. The source
image and other highlights do not change. Thumbnails, previews, PNGs and ZIPs render
that highlight's stitched result. Duplication makes an independent copy of its cuts.
Reset framing preserves cuts and marks; Restore all in the cut manager removes cuts only.

The original bitmap is never stitched or deleted. Only the selected highlight's
rendered view changes. Positions in the editor refer to its shortened, stitched image. Cut boundaries remain anchored
to the original source as you pan, zoom or change ratios. Adjacent/overlapping cuts
merge into one section. Up to 200 separate cuts per highlight are supported.

Committed cuts and divider preferences save with the local session. An unconfirmed
selection does not save or export; cancel or confirm it before downloading. The “…”
divider is app-added (not publisher text). Check the remaining excerpt's meaning,
line boundaries and attribution before posting.

## Editing safety
- **Undo / Redo** covers framing, zoom, ratio changes, marker strokes/clear, add/remove, reset, reorder, cuts and restoring cut sections.
  Mouse/touch drags are one edit; rapid wheel/nudge/slider edits are grouped.
- Shortcuts: Ctrl/⌘ Z = undo; Ctrl/⌘ Shift Z = redo (Ctrl Y also works).
- **Reset framing** returns the selected highlight to its framing at creation (or
  duplication), clamped to current source bounds. Reset is itself undoable.
- **Remove** deletes the selected highlight, but the last highlight is kept so the
  carousel is never empty. Removing is undoable.
- When the canvas has focus: arrow keys nudge; Shift + arrow keys make finer
  adjustments; Enter previews. Escape closes the preview.
- Undo history is in memory, up to 60 steps. It resets on reload or a new capture.
- A new capture/upload replaces the current highlights after confirmation. Failed
  captures leave existing work untouched. The current cached capture preserves edits.

## Session saving
The current source image, highlight positions, zoom, order, output ratio, marker strokes,
selection cuts, omission-divider preferences, framing locks and capture settings are
saved automatically in **IndexedDB in this browser**.
They restore after reload without another screenshot-service request. Check the
save indicator in the header before closing the tab.

This is a convenience save, not a backup: private browsing, disabled/quota-limited
storage, browser data clearing or eviction can prevent or remove it. A different
browser, device or site origin will not have the same session. Editing and exports
still work when storage is unavailable; the indicator warns that work is not saved.
One current session is stored; simultaneous tabs should be avoided (last save wins).
**Start over** clears the working capture and saved session after confirmation.

Uploaded images and PDFs stay in your browser (PDFs save as rendered PNGs).
Use Start over or clear the site's browser storage when finished on a shared device.

## Capture settings
Settings are in **Webpage appearance**, above the capture buttons and before the
framing workspace. They **start collapsed**, with a plain-language summary of the
selected width, capture area and photo wrapping. Output ratios remain visible, and
Capture is above the fold at 390 × 844 in the browser checks. Settings also collapse
automatically after capture or restore. Expand them to
change the next capture. A notice flags settings not yet applied to the current
screenshot; changing settings does not silently replace your highlights.
- **540px browser width** is the default; 430, 768 and 1080 are also available.
  Width triggers the publisher's responsive layout rather than enlarging a desktop view.
- **Article only** screenshots the first visible `article` element with its
  existing fonts and colors. It may include related content and normally excludes the
  masthead. **Include publisher logo** (on by default) copies a detected header logo
  above the article without the rest of the navigation; turn it off if the wrong logo
  is selected. Choose **Whole webpage** to include the full masthead.
- **Keep photos above or below the text** removes common left/right image wrapping while retaining
  fonts and colors. Disable it for the site's untouched image wrapping.
- **Give images time to load** requests eager images and original WordPress image files
  when supplied by the site, then waits 5 seconds. Some assets may still fail to load.
- Site menus and dialogs are not automatically closed. Dismiss them on the source page
  before capture if they should not appear in the screenshot.
- **Hide social buttons** (on by default) removes recognizable share widgets and
  social-network buttons from the webpage capture. Posts embedded in the article remain.
  Turn it off to keep share controls visible.
- Changed settings require clicking **Capture article**. **Retake screenshot** bypasses
  the matching in-session cache and requests a new service screenshot.

URL captures are sent to the external Microlink service. Its free tier is limited
(typically 25 requests/day/IP; policies and availability can change). Sites may block
capture, display cookie banners, require login, or omit assets. There is no paywall
bypass; upload your own browser screenshot if remote capture fails.
Framing, zooming, cutting, reordering, previews, saving and exports make no capture requests.

## Output
- 4:5 feed: **1080 × 1350**
- 1:1 square: **1080 × 1080**
- 9:16 story: **1080 × 1920**

A highlight is a rectangular pixel crop, optionally stitched around cut sections—not reflowed text. Check the crop edges:
they may cut through a line or photo. Ratio changes apply to every highlight, keeping
its position/zoom where possible. Crops are clamped to the source; below 100% zoom,
the source can be framed smaller than the output and the surrounding canvas stays white.
Short sources are padded white. Very large source images can exceed a device's memory limits.

ZIP export uses a built-in ZIP writer with CRC checksums and uncompressed entries
(PNGs are already compressed). No CDN library or multiple-download permission is
needed. Filenames are numbered in the current carousel order.

## Development and deployment
See the [repository README](../README.md) for local startup, GitHub Pages and test
commands, or [development notes](DEVELOPMENT.md) for renderer architecture.
