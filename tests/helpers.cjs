// Inspect the persisted original bitmap without exposing a debug API in the app.
exports.savedSource=async p=>{
 await p.waitForFunction(()=>['Saved on this device','Saved session restored'].includes(document.querySelector('#saveStatus').textContent));
 return p.evaluate(async()=>{const s=await new Promise((resolve,reject)=>{const r=indexedDB.open('newsgram-studio',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('session').objectStore('session').get('current');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=reject;};r.onerror=reject;});const bmp=await createImageBitmap(s.blob),width=bmp.width,height=bmp.height;bmp.close();const digest=await crypto.subtle.digest('SHA-256',await s.blob.arrayBuffer());return{width,height,type:s.blob.type,hash:Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''),meta:s.meta,markerStyle:s.markerStyle,highlights:s.highlights};});
};
