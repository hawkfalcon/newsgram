# Development notes

## Source of truth

`index.html` is both the editable app source and the deployable artifact. It has:

1. Inline CSS and HTML UI.
2. The first `<script>`: application logic in an IIFE.
3. An embedded PDF-engine block between `BEGIN EMBEDDED PDF ENGINE` and
   `END EMBEDDED PDF ENGINE`: generated classic-script factories and compressed assets.

Edit the first two parts for ordinary UI/behavior changes. Do not hand-edit the
large generated engine block. Keep the footer's third-party notices.

## Important contracts

- Screenshot/pixel rendering only; no article text scraping or reconstructed cards.
- `state.shot.bmp` is the immutable original image. Each highlight owns framing,
  zoom, cuts, divider preference, lock and initial/reset coordinates.
- `cutLayout`, `sourceToVirtual` and `virtualToSource` translate between original
  source positions and the stitched per-highlight view. Cut ranges stay anchored
  in original source coordinates. Cut adjustments remain cancellable drafts.
- `paint` is shared by editor, thumbnails and exports. Avoid separate render paths
  that could make downloaded pixels differ from the preview.
- Add uses the selected highlight's bottom in original-source coordinates, not the
  previous DOM scroll position. New highlights are independent and start at 100%
  zoom without cuts. At the end, clamp to the last full frame and explain it.
- Up to 20 highlights; 60 in-memory history snapshots. Undo history is not persisted.
- IndexedDB stores one current session per origin. Keep the version-1 restore path
  compatible or add an explicit migration. Never destructively replace a source
  before capture/import has fully succeeded.
- Mobile controls physically move into the dock; don't add duplicate slider state.
- Native sharing is capability-gated. Prepare files before a user taps Share so
  browser activation isn't lost; cancellation must not trigger downloads.

## PDF renderer

Pinned development tools:

- PDF.js `5.4.624`
- esbuild `0.25.12`
- Playwright: see `package.json` / lockfile

Rebuild from the repository root:

```sh
npm ci
npm run pdf:embed
npm run check
npm run test:all
```

Python 3 and Node must be on PATH. The bundler uses only Python's standard library.
It converts the upstream legacy PDF.js modules to classic ES2020 IIFEs and embeds
binary assets. Required notices are regenerated too. Review both changed files.

Do not reintroduce `import(blob:...)` as the startup loader: it previously failed
in Safari/WebKit and restricted previews. The app prefers a classic worker and
falls back to an in-page worker handler if workers are blocked. PDF JavaScript is
not executed. PDF tests exercise actual rendered documents, not a PDF mock.

## Testing

`npm test` runs the eight Chromium suites; `npm run test:all` adds PDF loader
coverage in WebKit. The runner creates an isolated server on an ephemeral port.
For one suite, use `node tools/test.cjs highlights-section` (or `browser`, `mobile`,
`cuts`, `touch`, `ratios`, `setup`, `pdf`, `pdf-loading`).

To test an existing server, set `NEWSGRAM_TEST_URL` (without a trailing slash).
`NEWSGRAM_ARTIFACT_DIR` overrides the default `validation/` output directory.
The test runner deliberately excludes the optional live-service smoke test and
obsolete tests for the retired Source/draft interface.

CI runs syntax and all nine browser suites on Ubuntu with Node 22, and uploads
artifacts even when a test fails. Browser checks are not physical iOS/Android
validation. Native OS sharing is tested via mocks, not a real Instagram picker.

Synthetic PDF fixtures are committed so Python PDF-generation libraries are not
needed for normal tests. To regenerate them, optionally install:

```sh
python3 -m pip install 'reportlab>=4,<5' 'pypdf>=5,<7' 'Pillow>=10.1,<13'
python3 tests/make-pdf-fixtures.py
```

`tests/capture-test.py` is an optional real Microlink smoke check. It requires
`requests` and Pillow, sends the hard-coded public article URL to Microlink and
consumes service quota. It is never run by `npm test` or CI.

## Local server and production

`tools/serve.cjs` is a development convenience with no runtime package dependency.
It binds to all interfaces by default, rejects hidden/path-traversal requests,
doesn't impose a preview-host allowlist, and sends no-cache headers. It is not an
application backend; production deploys only static files.

The optional Pages workflow stages only public app files, never fixtures, tools,
node_modules or test artifacts. Running CI does not publish the site.
