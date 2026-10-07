// Syntax-check the app and all committed JS, without executing the PDF renderer.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let scripts = 0;
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/type=["']application\/octet-stream["']/i.test(m[1])) continue;
  new vm.Script(m[2], { filename: `index.html:inline-${++scripts}` });
}
for (const folder of ['tools', 'tests']) {
  for (const file of fs.readdirSync(path.join(root, folder))) {
    if (file.endsWith('.cjs')) new vm.Script(fs.readFileSync(path.join(root, folder, file), 'utf8'), { filename: `${folder}/${file}` });
  }
}
if (scripts !== 3 || !html.includes('id="pdfBundle"')) throw Error('Expected app, PDF library, PDF worker and embedded PDF assets');
console.log(`PASS: ${scripts} embedded scripts and active JS tools/tests parse; PDF payload present.`);
