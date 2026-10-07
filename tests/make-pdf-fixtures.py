"""Generate deterministic PDF renderer fixtures. Dev only: reportlab, pypdf, Pillow."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw
from pypdf import PdfReader, PdfWriter
import io
root=Path(__file__).parent/'fixtures';root.mkdir(exist_ok=True)
buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(540,700),invariant=1)
c.setFillColorRGB(.97,.97,.94);c.rect(0,0,540,700,fill=1,stroke=0)
c.setFillColorRGB(.12,.18,.24);c.rect(0,555,540,145,fill=1,stroke=0)
c.setFillColorRGB(1,1,1);c.setFont('Times-Bold',30);c.drawString(30,642,'The local journal')
c.setFont('Helvetica',11);c.drawString(30,611,'PDF TEST FIXTURE / NOT A PUBLISHER ARTICLE')
c.setFont('Helvetica-Bold',19);c.drawString(30,577,'A story worth highlighting')
c.setFillColorRGB(.12,.18,.24)
for col in [30,282]:
 c.setFont('Times-Roman',13)
 for i in range(22):c.drawString(col,515-20*i,'A short excerpt keeps its original layout.')
c.setStrokeColorRGB(.7,.7,.7);c.line(266,55,266,525)
c.setFillColorRGB(.65,.1,.3);c.rect(30,25,480,12,fill=1,stroke=0);c.showPage()
c.setPageSize((720,480));c.setFillColorRGB(.08,.3,.6);c.rect(0,0,720,480,fill=1,stroke=0)
im=Image.new('RGB',(900,450),'#fff6da');d=ImageDraw.Draw(im)
d.rectangle((25,25,875,95),fill='#126358');d.text((45,45),'SCANNED PAGE TEST CONTENT',fill='white',font_size=28)
for i in range(8):d.text((45,120+i*34),'This scanned text is pixels, not extracted content.',fill='#172c43',font_size=24)
c.drawImage(ImageReader(im),40,60,640,320);c.setFillColorRGB(1,1,1);c.setFont('Helvetica-Bold',20);c.drawString(40,416,'Page 2: landscape + scanned image');c.showPage()
c.setPageSize((400,600));c.setFillColorRGB(.65,.08,.18);c.rect(0,0,400,600,fill=1,stroke=0)
c.setFillColorRGB(1,1,1);c.setFont('Courier-Bold',18);c.drawString(30,530,'Page 3: rotated');c.drawString(30,490,'Original appearance');c.save()
r=PdfReader(io.BytesIO(buf.getvalue()));w=PdfWriter()
for i,p in enumerate(r.pages):
 if i==2:p.rotate(90)
 w.add_page(p)
w.add_js('app.alert("PDF JavaScript must not execute");')
with open(root/'layout.pdf','wb') as f:w.write(f)
w=PdfWriter();[w.add_page(p) for p in r.pages];w.encrypt('test-password')
with open(root/'protected.pdf','wb') as f:w.write(f)
c=canvas.Canvas(str(root/'long.pdf'),pagesize=(540,700),invariant=1)
for i in range(25):c.setFont('Helvetica',30);c.drawString(30,640,'Test page '+str(i+1));c.showPage()
c.save()
c=canvas.Canvas(str(root/'too-tall.pdf'),pagesize=(200,20000),invariant=1);c.drawString(10,19900,'Very tall page');c.showPage();c.save()
print('Created fixtures in',root)
