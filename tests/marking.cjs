const { BASE_URL, artifact } = require('./config.cjs');
const { savedSource } = require('./helpers.cjs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(BASE_URL);
  await page.waitForFunction(() => !document.querySelector('#go').disabled);

  const fixture = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 8000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#18243b';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('A passage worth highlighting', 80, 160);
    return canvas.toDataURL().split(',')[1];
  }), 'base64');

  await page.locator('#file').setInputFiles({ name: 'marking-fixture.png', mimeType: 'image/png', buffer: fixture });
  await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Screenshot loaded'));
  assert.equal(await page.locator('#zoom').getAttribute('min'), '1');
  assert.equal(await page.locator('#zoom').getAttribute('max'), '150');
  const canvas = page.locator('#editorCanvas');
  const original = await canvas.evaluate(element => element.toDataURL());

  await page.locator('#markerTool').click();
  assert.equal(await page.locator('#markerTool').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#markerPanel').isVisible(), true);
  assert.equal(await page.locator('[data-marker-color="#ffe45b"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await canvas.evaluate(element => element.classList.contains('marking')), true);
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const point = (x, y) => ({ x: box.x + box.width * x / 1080, y: box.y + box.height * y / 1350 });
  const start = point(70, 150), end = point(850, 150);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 24 });
  await page.mouse.up();
  const marked = await canvas.evaluate(element => element.toDataURL());
  assert.notEqual(marked, original, 'a freehand highlighter stroke changes the preview');
  assert.equal(await page.locator('#clearMarks').isVisible(), true);
  await page.waitForFunction(() => document.querySelector('#saveStatus').textContent === 'Saved on this device');
  const stored = await savedSource(page);
  assert.equal(stored.highlights[0].marks.length, 1);
  assert.equal(stored.highlights[0].marks[0].color, '#ffe45b');
  assert.equal(stored.highlights[0].marks[0].width, 28);
  assert(stored.highlights[0].marks[0].paths[0].length > 1);

  // The downloaded PNG uses the same marked pixels as the editor.
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadOne').click();
  const download = await downloadPromise;
  await download.saveAs(artifact('newsgram-marked.png'));
  const pngBase64 = fs.readFileSync(artifact('newsgram-marked.png')).toString('base64');
  const exportedPixel = await page.evaluate(async encoded => {
    const blob = await (await fetch('data:image/png;base64,' + encoded)).blob();
    const bitmap = await createImageBitmap(blob);
    const out = document.createElement('canvas');
    out.width = bitmap.width;
    out.height = bitmap.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return Array.from(ctx.getImageData(700, 150, 1, 1).data);
  }, pngBase64);
  const previewPixel = await canvas.evaluate(element => Array.from(element.getContext('2d').getImageData(700, 150, 1, 1).data));
  assert.deepEqual(exportedPixel, previewPixel, 'PNG export includes the highlighter overlay');

  // Clear/undo/redo works as one edit, with the marks remaining local to each highlight.
  await page.locator('#clearMarks').click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), original);
  await page.locator('#undo').click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), marked);
  await page.locator('#redo').click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), original);
  await page.locator('#undo').click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), marked);

  await page.locator('#duplicate').click();
  assert.equal(await page.locator('.thumb').count(), 2);
  assert.equal(await canvas.evaluate(element => element.toDataURL()), marked, 'duplicate keeps its independent mark copy');
  await page.locator('#clearMarks').click();
  await page.getByRole('button', { name: 'Select highlight 1', exact: true }).click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), marked, 'clearing a duplicate does not erase the original mark');
  await page.waitForFunction(() => document.querySelector('#saveStatus').textContent === 'Saved on this device');

  // A pre-color version-1 session has no per-stroke color or brush preference.
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('newsgram-studio', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite'), store = tx.objectStore('session'), req = store.get('current');
      req.onsuccess = () => { const session = req.result; delete session.markerStyle; for (const mark of session.highlights[0].marks) delete mark.color; store.put(session, 'current'); };
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#saveStatus').textContent === 'Saved session restored');
  assert.equal(await page.locator('#editorCanvas').evaluate(element => element.toDataURL()), marked, 'legacy colorless strokes restore as default yellow');
  const legacySession = await savedSource(page);
  assert.equal(legacySession.markerStyle, undefined, 'legacy sessions without brush preferences remain valid');
  assert.equal(legacySession.highlights[0].marks[0].color, undefined, 'legacy strokes do not need migration');

  // Brush choices are saved on each new stroke; the dedicated undo removes only the latest one.
  await page.locator('#markerTool').click();
  await page.locator('[data-marker-color="#ff77a8"]').click();
  await page.locator('#markerWidth').fill('40');
  await canvas.scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#markerWidthValue').textContent(), '40px');
  const styledBox = await canvas.boundingBox();
  const styledPoint = (x, y) => ({ x: styledBox.x + styledBox.width * x / 1080, y: styledBox.y + styledBox.height * y / 1350 });
  const styledStart = styledPoint(90, 240), styledEnd = styledPoint(920, 240);
  await page.mouse.move(styledStart.x, styledStart.y); await page.mouse.down();
  await page.mouse.move(styledEnd.x, styledEnd.y, { steps: 20 }); await page.mouse.up();
  const styledSession = await savedSource(page);
  assert.equal(styledSession.highlights[0].marks.length, 2);
  assert.deepEqual(styledSession.highlights[0].marks.slice(-1).map(({color,width})=>({color,width})), [{color:'#ff77a8',width:40}]);
  assert.deepEqual(styledSession.markerStyle, {color:'#ff77a8',width:40});
  await page.locator('#undoStroke').click();
  assert.equal(await canvas.evaluate(element => element.toDataURL()), marked, 'Undo stroke removes only the latest mark');
  await page.waitForFunction(() => document.querySelector('#saveStatus').textContent === 'Saved on this device');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#saveStatus').textContent === 'Saved session restored');
  await page.locator('#markerTool').click();
  assert.equal(await page.locator('[data-marker-color="#ff77a8"]').getAttribute('aria-pressed'), 'true', 'selected marker color is restored');
  assert.equal(await page.locator('#markerWidth').inputValue(), '40', 'selected brush size is restored');
  await page.locator('#markerTool').click();

  // Presets center their zoom change; Fit source automatically drops below 25% for long captures.
  await page.locator('#zoomPresets [data-zoom="50"]').click();
  assert.equal(await page.locator('#zoom').inputValue(), '50');
  assert.equal(await page.locator('#zoomPresets [data-zoom="50"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#zoomPresets [data-zoom="150"]').click();
  assert.equal(await page.locator('#zoom').inputValue(), '150');
  await page.locator('#fitSource').click();
  assert.equal(await page.locator('#zoom').inputValue(), '17', '8,000px source fits below the 25% preset');
  assert.equal(await page.locator('#position').inputValue(), '0', 'Fit source centers the complete source vertically');
  assert.equal(await page.locator('#sourceOutline').isVisible(), true, 'source boundary is visible on white margins');
  const outlinePixel = await canvas.evaluate(element => Array.from(element.getContext('2d').getImageData(465, 700, 1, 1).data));
  assert.deepEqual(outlinePixel, [219,234,254,255], 'the editor-only source outline is not painted into the canvas');
  const fitDownloadPromise = page.waitForEvent('download');
  await page.locator('#downloadOne').click();
  const fitDownload = await fitDownloadPromise;
  await fitDownload.saveAs(artifact('newsgram-fit-source.png'));
  const fitPngBase64 = fs.readFileSync(artifact('newsgram-fit-source.png')).toString('base64');
  const fitExportPixel = await page.evaluate(async encoded => {
    const bitmap = await createImageBitmap(await (await fetch('data:image/png;base64,' + encoded)).blob());
    const out = document.createElement('canvas'); out.width = bitmap.width; out.height = bitmap.height;
    const ctx = out.getContext('2d'); ctx.drawImage(bitmap, 0, 0); bitmap.close();
    return Array.from(ctx.getImageData(465, 700, 1, 1).data);
  }, fitPngBase64);
  assert.deepEqual(fitExportPixel, outlinePixel, 'PNG output excludes the editor-only screenshot boundary');
  const frameData = await canvas.evaluate(element => element.toDataURL());
  await page.locator('#preview').click();
  assert.equal(await page.locator('#lightboxImg').getAttribute('src'), frameData, 'preview contains only canvas pixels, not the editor boundary');
  await page.locator('#closeLightbox').click();

  // Zooming below 100% scales the source down, permits negative framing offsets,
  // and reveals the editor's white canvas around the original screenshot.
  await page.locator('#zoom').fill('25');
  assert.equal(await page.locator('#zoomValue').textContent(), '25%');
  assert.equal(await page.locator('#sourceOutline').isVisible(), true);
  assert(Number(await page.locator('#position').getAttribute('min')) < 0);
  const margins = await page.locator('#editorCanvas').evaluate(element => {
    const ctx = element.getContext('2d');
    const pixel = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    return { white: pixel(50, 675), source: pixel(540, 675) };
  });
  assert.deepEqual(margins.white, [255, 255, 255, 255]);
  assert.notDeepEqual(margins.source, margins.white);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  // The dock exposes the same tool on touch-sized screens and stays within 320px.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForFunction(() => document.querySelector('#dockMark').getClientRects().length > 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('#dockMark').click();
  assert.equal(await page.locator('#dockMark').getAttribute('aria-pressed'), 'true');
  await page.locator('#dockMark').click();
  assert.equal(await page.locator('#dockMark').getAttribute('aria-pressed'), 'false');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: freehand/styled marks, undo stroke, clear/undo/redo, duplicate isolation, PNG rendering, persistence, 1–150% presets, Fit source below 25%, editor-only source bounds, white margins, and mobile dock; no JS errors.');
})().catch(error => { console.error(error); process.exit(1); });
