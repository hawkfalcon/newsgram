# NewsGram

A static highlight editor for turning public webpages, screenshots and PDFs into
Instagram-ready PNGs. **The app ships as one self-contained `index.html`.** No
application server, deployment build, API key or runtime CDN is required.
Webpage captures use the external Microlink service; file uploads are processed locally.

## Start here

### Run the app

With Node.js 22 (recommended; minimum 20.19):

```sh
npm start
```

Open **http://localhost:8080**. No `npm install` is needed just to serve the committed app.
The development server binds to `0.0.0.0` and accepts preview hostnames.
Use `PORT=8081 npm start` on macOS/Linux if 8080 is occupied, or set the `PORT`
environment variable in your shell. This server is for local development, not production.

Alternatively, without Node:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

### Use it

1. Capture an article URL, or upload an image/PDF.
2. Scroll, drag, zoom and cut in the single highlight editor.
3. Click **＋ Add highlight** in the **Highlights** thumbnail strip. A new highlight
   immediately starts after the selected excerpt, accounting for its zoom and cuts.
4. Reorder and export individual PNGs or a carousel ZIP. Mobile also offers supported
   native file sharing.

**Settings** is in the carousel header. There is no separate Source view or Add
confirmation step. See the [user guide](docs/USER_GUIDE.md) for the full workflow,
PDF limits, privacy details and keyboard shortcuts.

## Put it in Git

### Upload using GitHub's website

1. Create an empty repository.
2. Extract the handoff ZIP, then upload the **contents** of its `newsgram/` folder—not
   the ZIP and not an extra containing folder. `index.html` belongs at the repo root.
3. Include dotfiles (`.gitignore`, `.github/`, etc.); some file pickers hide them.
4. Commit the upload. CI will run when the workflow files are present.

### Or use Git locally

From inside the extracted `newsgram/` directory:

```sh
git init -b main
git add .
git commit -m "Initial NewsGram app"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example URL with your repository. Configure your own Git name/email if
Git asks. No remote, credentials, author identity or initial commit is supplied here.

**Important:** browser sessions are stored in IndexedDB for one browser/site origin.
They are not part of the repository and do not migrate to a new GitHub Pages URL.
Download any highlights you need before leaving the old preview.

## GitHub Pages

Choose **one** deployment method:

- **Simplest:** Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
  `.nojekyll` is included; the app needs no build. This publishes the repo's public files.
- **App files only:** Settings → Pages → Source: **GitHub Actions**, then run
  **Actions → Deploy Pages → Run workflow**. The included manual workflow publishes
  only `index.html`, `.nojekyll` and the third-party notices. It does not deploy on
  every push unless you choose to add that trigger.

The site will be `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
GitHub Actions and Pages configuration have not been run against your remote repository.

## Continue development

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run check
npm run test:all
```

`npm run test:all` starts its own local server on a free port, runs all **nine** active
suites, and shuts the server down. It does not consume Microlink requests. On Linux,
Playwright's `--with-deps` may need system-package privileges.

| Command | What it does |
| --- | --- |
| `npm start` / `npm run dev` | Serve the app on port 8080 |
| `npm run check` | Check inline app/PDF scripts and JS tooling syntax |
| `npm test` | Eight Chromium suites |
| `npm run test:all` | Chromium suites plus PDF loader checks in Chromium/WebKit |
| `npm run test:pdf-loading` | PDF worker/CSP/sandbox compatibility checks |
| `npm run screenshots` | Generate synthetic-data screenshots in `validation/` |
| `npm run pdf:embed` | Rebuild the PDF bundle; needs `npm ci` and Python 3 |

Tests, generated screenshots, downloads and reports use `validation/`, which is
ignored by Git. Dependencies are development-only and pinned in `package-lock.json`.
See [development notes](docs/DEVELOPMENT.md) and the [handoff](docs/HANDOFF.md) before
changing the rendering or editing model.

## Repository layout

```text
index.html                      App UI, styles, editor and embedded PDF renderer
PDF-THIRD-PARTY-NOTICES.txt       PDF.js/font/decoder licenses (also inside the HTML)
package.json / package-lock.json Development tools and reproducible dependency install
.github/workflows/               Browser CI and optional manual Pages deployment
tools/                          Local server, test runner, syntax check, PDF bundler
tests/                          Current browser tests and synthetic PDF fixtures
docs/                           User guide, development notes and handoff
```

The HTML is about 4.2 MB because PDF.js, its worker, fonts and decoding assets are
embedded. Most UI changes do **not** require rebuilding that bundle.

## Privacy and licensing

- Uploaded images/PDFs are processed in the browser. The saved session contains the
  rendered image and edits, not PDF passwords or original PDF bytes.
- Article URLs are sent to Microlink; rate limits, blocked sites and missing assets
  can affect capture. Upload a screenshot/PDF when capture fails.
- Do not commit credentials, private PDFs or real uploaded documents. The committed
  fixtures are labeled synthetic test content, including a test-only encrypted PDF.
- **No license has been selected for NewsGram's application code** (`UNLICENSED` in
  package metadata). Choose one before offering reuse rights. Third-party components
  retain their own licenses; keep the notices and the notices embedded in the HTML.
