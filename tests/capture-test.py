from pathlib import Path
ARTIFACTS=Path(__file__).resolve().parent.parent/'validation'
ARTIFACTS.mkdir(exist_ok=True)
import requests
p={'url':'https://www.independent.com/2026-09-29/jim-knells-big-move-santa-barbara-real-estate-mogul-launches-drive-to-get-cars-back-on-state-street/','screenshot':'true','meta':'false','embed':'screenshot.url','viewport.width':540,'viewport.height':900,'viewport.deviceScaleFactor':2,'screenshot.element':'article','waitForTimeout':5000,'scripts':"document.querySelectorAll('img').forEach(i=>{i.loading='eager';if(i.dataset.origFile){i.removeAttribute('srcset');i.src=i.dataset.origFile}})",'styles':'article .alignleft,article .alignright{float:none!important;clear:both!important;max-width:100%!important;width:auto!important;margin-left:0!important;margin-right:0!important}article img{max-width:100%!important;height:auto!important}'}
r=requests.get('https://api.microlink.io/',params=p,timeout=100)
print(r.status_code,r.headers.get('content-type'),len(r.content))
if r.headers.get('content-type','').startswith('image'):
 open(ARTIFACTS/'newsgram-test-capture.png','wb').write(r.content)
 from PIL import Image
 im=Image.open(ARTIFACTS/'newsgram-test-capture.png');print(im.size)
 im.thumbnail((430,30000));im.save(ARTIFACTS/'newsgram-test-capture-small.png')
else: print(r.text[:1000])
