const {BASE_URL,ARTIFACT_DIR,artifact}=require('./config.cjs');
// Regression for Safari's "Importing a module script failed" under restricted loading.
const {chromium,webkit}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),fixture=path.join(__dirname,'fixtures/layout.pdf');
 for(const [name,engine]of Object.entries({chromium,webkit})){
  const browser=await engine.launch();
  for(const mode of ['normal','blocked-worker','opaque-sandbox']){
   const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[],requests=[];let workers=0;
   p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(BASE_URL+'/'))requests.push(r.url());});p.on('worker',()=>workers++);
   p.on('dialog',d=>d.accept());
   const policy="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; worker-src 'none'; connect-src 'none'";
   if(mode==='blocked-worker')await p.route(BASE_URL+'/',r=>r.fulfill({status:200,contentType:'text/html',headers:{'Content-Security-Policy':policy},body:html}));
   if(mode==='opaque-sandbox')await p.route(BASE_URL+'/',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><style>iframe{width:100%;height:96vh;border:0}</style><iframe sandbox="allow-scripts" id="app"></iframe><script>document.querySelector("#app").srcdoc='+JSON.stringify(html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'">')).replace(/<\//g,'<\\/')+';</script>'}));
   await p.goto(BASE_URL+'/');
   const frame=mode==='opaque-sandbox'?await p.locator('#app').elementHandle().then(e=>e.contentFrame()):p;
   await frame.waitForFunction(()=>!!document.querySelector('#go')&&!document.querySelector('#go').disabled);
   // Playwright WebKit's offline toggle also breaks plain Blob.arrayBuffer()
   // (an engine/test-harness quirk). Block all HTTP instead in WebKit.
   if(name==='chromium')await context.setOffline(true);else await context.route(/^https?:/,r=>r.abort());
   await frame.locator('#file').setInputFiles(fixture);await frame.waitForFunction(()=>!document.querySelector('#pdfImportGo').hidden||!document.querySelector('#go').disabled);assert(await frame.locator('#pdfImport').isVisible(),await frame.locator('#status').textContent());await frame.locator('#pdfImportGo').click();await frame.waitForFunction(()=>!document.querySelector('#go').disabled);
   assert((await frame.locator('#status').textContent()).startsWith('PDF loaded'),name+' / '+mode+': '+await frame.locator('#status').textContent());
   assert.deepEqual(await frame.locator('#editorCanvas').evaluate(e=>[e.width,e.height]),[1080,1350]);assert.equal(await frame.locator('#position').getAttribute('max'),'1490');assert((await frame.locator('#documentInfo').textContent()).includes('3 PDF pages'));
   const fallback=await frame.evaluate(()=>!!globalThis.pdfjsWorker);
   if(mode==='normal'){assert(workers>0,`${name}: expected a real worker`);assert(!fallback,`${name}: unexpectedly used fallback`);}
   else assert(fallback,`${name}: expected in-page fallback`);
   // Repeated imports and cancellation also work after the fake worker has been initialized.
   const before=await frame.locator('#editorCanvas').evaluate(c=>c.toDataURL());
   // Opaque sandbox confirmation dialogs are disallowed by design; test its first import only.
   if(mode!=='opaque-sandbox'){
    await frame.locator('#file').setInputFiles(fixture);await frame.waitForFunction(()=>!document.querySelector('#pdfImportGo').hidden);await frame.locator('#pdfCancel').click();await frame.waitForFunction(()=>!document.querySelector('#go').disabled);assert.equal(await frame.locator('#editorCanvas').evaluate(c=>c.toDataURL()),before);
    await frame.locator('#file').setInputFiles(fixture);await frame.waitForFunction(()=>!document.querySelector('#pdfImportGo').hidden);await frame.locator('#pdfImportGo').click();await frame.waitForFunction(()=>!document.querySelector('#go').disabled);assert.equal(await frame.locator('#editorCanvas').evaluate(c=>c.toDataURL()),before);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log(`PASS: ${name} ${mode}: local PDF rendered ${fallback?'without modules or workers':'in a classic worker'}; no external requests or JS errors.`);await context.close();
  }
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
