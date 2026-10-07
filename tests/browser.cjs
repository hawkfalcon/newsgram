const {BASE_URL,ARTIFACT_DIR,artifact}=require('./config.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:1100}}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(BASE_URL+'/');await page.waitForFunction(()=>!document.querySelector('#go').disabled);
 const fixture=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=540;c.height=4000;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,540,4000);for(let y=0;y<4000;y+=100){x.fillStyle=`hsl(${y/20},60%,90%)`;x.fillRect(0,y,540,100);x.fillStyle='#18243b';x.font='22px sans-serif';x.fillText('Article paragraph at '+y,24,y+50);}return c.toDataURL().split(',')[1];}),'base64');
 let calls=0,fail=false,lastURL;
 await page.route('https://api.microlink.io/**',route=>{calls++;lastURL=new URL(route.request().url());return route.fulfill(fail?{status:429,contentType:'application/json',body:'{"message":"rate limited"}'}:{status:200,contentType:'image/png',body:fixture});});
 await page.locator('#url').fill('https://example.com/story');await page.locator('#go').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Captured'));
 assert.equal(lastURL.searchParams.get('viewport.width'),'540');assert.equal(lastURL.searchParams.get('screenshot.element'),'article');assert(!lastURL.searchParams.has('screenshot.fullPage'));
 assert.equal(await page.locator('.thumb').count(),1);assert.equal(await page.locator('#captureDetails').getAttribute('open'),null);assert.equal(await page.locator('#editorCanvas').count(),1);
 const pos=()=>page.locator('#position').inputValue(),zoom=()=>page.locator('#zoom').inputValue(),hash=()=>page.locator('#editorCanvas').evaluate(c=>c.toDataURL());
 await page.locator('#position').fill('1000');await page.locator('#zoom').fill('112');const frame1={pos:await pos(),zoom:await zoom(),hash:await hash()};
 await page.locator('#addNext').click();const newInitial=await pos();assert.equal(await page.locator('.thumb').count(),2);assert.equal(await zoom(),'100');await page.locator('#position').fill('2500');await page.locator('#zoom').fill('120');const frame2={pos:await pos(),zoom:await zoom(),hash:await hash()};
 await page.getByRole('button',{name:'Select highlight 1',exact:true}).click();assert.equal(await hash(),frame1.hash);
 await page.getByRole('button',{name:'Select highlight 2',exact:true}).click();assert.equal(await hash(),frame2.hash);
 await page.locator('#reset').click();assert.equal(await zoom(),'100');assert.equal(await pos(),newInitial);await page.locator('#undo').click();assert.equal(await hash(),frame2.hash);await page.locator('#redo').click();assert.equal(await pos(),newInitial);await page.locator('#undo').click();
 // Nudge -> undo, wheel and mouse drag preserve other highlights.
 await page.locator('#nudgeDown').click();assert.notEqual(await hash(),frame2.hash);await page.locator('#undo').click();assert.equal(await hash(),frame2.hash);
 await page.locator('#editorCanvas').hover();await page.mouse.wheel(0,40);await page.waitForTimeout(100);assert.notEqual(await pos(),frame2.pos);await page.locator('#undo').click();assert.equal(await hash(),frame2.hash);
 const r=await page.locator('#editorCanvas').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2,r.y+r.height/2-30,{steps:4});await page.mouse.up();await page.waitForTimeout(80);assert.notEqual(await pos(),frame2.pos);await page.locator('#undo').click();assert.equal(await hash(),frame2.hash);
 // Desktop handle drag reorders real IDs, with undo and keyboard-compatible move controls.
 const ids=()=>page.locator('.thumb').evaluateAll(ns=>ns.map(n=>n.dataset.id));const oldIds=await ids();
 const g1=await page.locator('.grip').first().boundingBox(),g2=await page.locator('.grip').nth(1).boundingBox();await page.mouse.move(g1.x+5,g1.y+8);await page.mouse.down();await page.mouse.move(g2.x+5,g2.y+8,{steps:6});await page.mouse.up();assert.deepEqual(await ids(),oldIds.slice().reverse());
 await page.locator('#undo').click();assert.deepEqual(await ids(),oldIds);await page.getByRole('button',{name:'Select highlight 2',exact:true}).click();await page.locator('#reorderTools summary').click();await page.locator('#moveLeft').click();await page.locator('#reorderTools summary').click();assert.deepEqual(await ids(),oldIds.slice().reverse());assert.equal(await hash(),frame2.hash);
 await page.locator('#duplicate').click();assert.equal(await page.locator('.thumb').count(),3);await page.locator('#remove').click();assert.equal(await page.locator('.thumb').count(),2);await page.locator('#undo').click();assert.equal(await page.locator('.thumb').count(),3);await page.locator('#redo').click();assert.equal(await page.locator('.thumb').count(),2);
 if(await page.locator('.setup-panel').isHidden())await page.locator('#mobileSetup').click();
 for(const [ratio,height] of [['1:1',1080],['9:16',1920],['4:5',1350]]){await page.locator(`[data-ratio="${ratio}"]`).click();assert.deepEqual(await page.locator('#editorCanvas').evaluate(c=>[c.width,c.height]),[1080,height]);}
 await page.getByRole('button',{name:'Select highlight 1',exact:true}).click();assert.equal(await hash(),frame2.hash);
 const promise=page.waitForEvent('download');await page.locator('#downloadAll').click();const zip=await promise;await zip.saveAs(artifact('newsgram-export.zip'));assert.equal(zip.suggestedFilename(),'story-highlights.zip');
 const one=page.waitForEvent('download');await page.locator('#downloadOne').click();const png=await one;await png.saveAs(artifact('newsgram-first.png'));assert(png.suggestedFilename().endsWith('-highlight-01.png'));
 await page.locator('#preview').click();assert(await page.locator('#lightbox').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#lightbox').isHidden());
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved on this device');const beforeRestore={ids:await ids(),hash:await hash(),zoom:await zoom(),pos:await pos()};
 await page.reload();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved session restored');assert.deepEqual(await ids(),beforeRestore.ids);assert.equal(await hash(),beforeRestore.hash);assert.equal(await zoom(),beforeRestore.zoom);assert.equal(calls,1);
 await page.locator('#mobileSetup').click();await page.locator('#go').click();assert.equal(calls,1);assert.equal(await hash(),beforeRestore.hash);
 await page.locator('#captureDetails').evaluate(e=>e.open=true);fail=true;await page.locator('#recapture').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Capture failed'));assert.equal(await hash(),beforeRestore.hash);
 await page.locator('#captureDetails').evaluate(e=>e.open=false);await page.screenshot({path:artifact('newsgram-studio-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:artifact('newsgram-studio-mobile.png'),fullPage:true});
 // Upload saves locally; clear removes persisted work across reload.
 await page.locator('#file').setInputFiles({name:'local.png',mimeType:'image/png',buffer:fixture});await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Screenshot loaded'));assert.equal(calls,2);assert(await page.locator('#originalLink').isHidden());
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved on this device');await page.locator('#startOver').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved session cleared');await page.reload();await page.waitForFunction(()=>!document.querySelector('#go').disabled);assert.equal(await page.locator('.thumb').count(),0);
 // Storage denial doesn't block capture/upload.
 const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw Error('Denied')}}));const q=await blocked.newPage();await q.goto(BASE_URL);await q.waitForFunction(()=>!document.querySelector('#go').disabled);await q.locator('#file').setInputFiles({name:'local.png',mimeType:'image/png',buffer:fixture});await q.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Screenshot loaded'));await q.waitForFunction(()=>document.querySelector('#saveStatus').textContent.startsWith('Not saved'));assert(await q.locator('#editor').isVisible());await blocked.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: focused editor, independent framing/zoom, drag reorder, undo/redo/reset, ratios, ZIP/PNG, IndexedDB restore, cache, failures, uploads, clear, storage denial, mobile width; no JS errors.');
})().catch(e=>{console.error(e);process.exit(1)});
