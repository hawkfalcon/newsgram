const {BASE_URL,ARTIFACT_DIR,artifact}=require('./config.cjs');
const {savedSource}=require('./helpers.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto(BASE_URL);await p.waitForFunction(()=>!document.querySelector('#go').disabled);
 const fixture=Buffer.from(await p.evaluate(()=>{const c=document.createElement('canvas');c.width=1080;c.height=4000;const x=c.getContext('2d');for(let y=0;y<4000;y++){x.fillStyle=`rgb(${Math.floor(y/100)*6},${y%200},100)`;x.fillRect(0,y,1080,1);}return c.toDataURL().split(',')[1];}),'base64');await p.locator('#file').setInputFiles({name:'stripes.png',mimeType:'image/png',buffer:fixture});await p.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Screenshot loaded'));
 const hash=()=>p.locator('#editorCanvas').evaluate(c=>c.toDataURL());const pixel=y=>p.locator('#editorCanvas').evaluate((c,y)=>Array.from(c.getContext('2d').getImageData(100,y,1,1).data),y);
 const originalColor=y=>[Math.floor(y/100)*6,y%200,100,255];const original=await hash(),source=(await savedSource(p)).hash;
 const saved=async()=>{await p.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved on this device');return p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('newsgram-studio',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('session').objectStore('session').get('current');q.onsuccess=()=>{resolve(q.result);db.close()};q.onerror=reject};}));};
 const cut=async(top,bottom,divider=false)=>{await p.locator('#cutSection').click();await p.locator('#cutBottom').fill(String(Math.max(bottom,top+4)));await p.locator('#cutTop').fill(String(top));await p.locator('#cutBottom').fill(String(bottom));await p.locator('#cutDivider').setChecked(divider);await p.locator('#applyCut').click();};
 await p.locator('#duplicate').click();assert.equal(await p.locator('.thumb').count(),2);
 // Cancel never changes the image or original capture.
 await p.locator('#cutSection').click();await p.locator('#cutTop').fill('123');await p.keyboard.press('Escape');assert.equal(await hash(),original);
 await cut(300,500);assert.equal(await p.locator('#editCuts').textContent(),'1 section cut · Edit');assert.equal((await savedSource(p)).hash,source);
 assert.deepEqual(await pixel(200),originalColor(200));assert.deepEqual(await pixel(300),originalColor(500));assert.deepEqual(await pixel(900),originalColor(1100));const firstCut=await hash();
 await p.locator('#undo').click();assert.equal(await hash(),original);await p.locator('#redo').click();assert.equal(await hash(),firstCut);
 await p.getByRole('button',{name:'Select highlight 1',exact:true}).click();assert.equal(await hash(),original);assert(await p.locator('#editCuts').isHidden());await p.getByRole('button',{name:'Select highlight 2',exact:true}).click();assert.equal(await hash(),firstCut);
 // Subsequent cuts map back to the original source, not already-compressed pixels.
 await cut(700,900);assert.equal(await p.locator('#editCuts').textContent(),'2 sections cut · Edit');assert.deepEqual(await pixel(700),originalColor(1100));
 let session=await saved(),h=session.highlights[1];assert.deepEqual(h.cuts,[{start:300,end:500},{start:900,end:1100}]);
 // Crossing a previous join merges original intervals, retaining the separate later cut.
 await cut(200,600);session=await saved();assert.deepEqual(session.highlights[1].cuts,[{start:200,end:800},{start:900,end:1100}]);assert.deepEqual(await pixel(200),originalColor(800));assert.deepEqual(await pixel(300),originalColor(1100));
 await p.locator('#undo').click();await p.locator('#editCuts').click();await p.locator('#showCutDividers').check();assert.equal(await p.locator('#showCutDividers').isChecked(),true);assert.deepEqual(await pixel(310),[243,244,246,255]);assert.deepEqual(await pixel(350),originalColor(522));
 const withDividers=await hash();session=await saved();assert(session.highlights[1].showCuts);await p.reload();await p.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved session restored');assert.equal(await hash(),withDividers);assert.equal(await p.locator('#editCuts').textContent(),'2 sections cut · Edit');
 // Standard PNG + ZIP contain the stitched view, not the untouched source or selection overlay.
 let download=p.waitForEvent('download');await p.locator('#downloadOne').click();await(await download).saveAs(artifact('newsgram-cut.png'));download=p.waitForEvent('download');await p.locator('#downloadAll').click();await(await download).saveAs(artifact('newsgram-cut.zip'));
 await p.locator('#editCuts').click();await p.getByRole('button',{name:'Restore cut section 1',exact:true}).click();assert.equal(await p.locator('#editCuts').textContent(),'1 section cut · Edit');assert.deepEqual(await pixel(300),originalColor(300));await p.locator('#undo').click();assert.equal(await hash(),withDividers);
 // Duplication makes a deep copy; restoring one clone does not alter its sibling.
 await p.locator('#duplicate').click();assert.equal(await hash(),withDividers);await p.locator('#editCuts').click();await p.locator('#restoreAllCuts').click();assert.equal(await hash(),original);await p.getByRole('button',{name:'Select highlight 2',exact:true}).click();assert.equal(await hash(),withDividers);
 // Ratio and zoom still work; resetting framing leaves cuts in place.
 if(await p.locator('.setup-panel').isHidden())await p.locator('#mobileSetup').click();
 for(const [ratio,height]of [['1:1',1080],['9:16',1920],['4:5',1350]]){await p.locator(`[data-ratio="${ratio}"]`).click();assert.deepEqual(await p.locator('#editorCanvas').evaluate(c=>[c.width,c.height]),[1080,height]);assert.equal(await p.locator('#editCuts').textContent(),'2 sections cut · Edit');}
 await p.locator('#zoom').fill('115');await p.locator('#reset').click();assert.equal(await hash(),withDividers);
 // Near-end cut leaves the upper content in place and pads the short remainder.
 await p.getByRole('button',{name:'Select highlight 1',exact:true}).click();await p.locator('#position').fill('2500');await cut(500,1000);assert.equal(await p.locator('#position').inputValue(),'2500');assert.deepEqual(await pixel(100),originalColor(2600));assert.deepEqual(await pixel(600),originalColor(3600));assert.deepEqual(await pixel(1200),[255,255,255,255]);
 // A cut at nonzero zoom removes the correct original range.
 await p.getByRole('button',{name:'Select highlight 3',exact:true}).click();await p.locator('#zoom').fill('125');await p.locator('#position').fill('1000');await cut(250,500);session=await saved();assert.deepEqual(session.highlights[2].cuts,[{start:1200,end:1400}]);
 // Keyboard controls and mobile bounds in selection mode.
 await p.setViewportSize({width:390,height:844});await p.locator('#dockCut').click();await p.locator('#cutTop').fill('100');await p.locator('#cutBottom').fill('300');await p.locator('[data-edge="top"]').focus();await p.keyboard.press('ArrowDown');assert.equal(await p.locator('#cutTop').inputValue(),'108');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:artifact('newsgram-cut-mobile.png'),fullPage:true});await p.locator('#cancelCut').click();assert(await p.locator('#cutOverlay').isHidden());
 assert.deepEqual(errors,[]);await b.close();console.log('PASS: local nondestructive cuts, cancellation, exact pixel stitching, merged cuts, separators, undo/redo, individual restore, duplication, source preservation, ratios, zoom, tail padding, persistence, PNG/ZIP and mobile controls.');
})().catch(e=>{console.error(e);process.exit(1)});
