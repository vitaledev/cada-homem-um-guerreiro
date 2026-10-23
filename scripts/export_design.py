from pathlib import Path
import shutil,json,hashlib,base64,html
from PIL import Image
import cairosvg
root=Path(__file__).resolve().parent.parent
import os
os.chdir(root)
for name in ['camiseta','garrafa','caderno','kit']:
 im=Image.open(root/f'design/mockups/{name}.png');im.thumbnail((1200,1200));im.save(root/f'design/mockups/{name}.webp',quality=90)
icons={'busca':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>','sacola':'<path d="M5 8h14l1 13H4L5 8Z M8 8V6a4 4 0 0 1 8 0v2"/>','menu':'<path d="M3 7h18M3 12h18M3 17h18"/>','fechar':'<path d="m5 5 14 14M19 5 5 19"/>','seta':'<path d="M5 19 19 5M5 5h14v14"/>','usuario':'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>','seguranca':'<path d="m12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5l8-3Z M8 12l3 3 5-6"/>','entrega':'<path d="M1 5h13v12H1Z M14 9h5l4 5v3h-9"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>','mais':'<path d="M12 4v16M4 12h16"/>','menos':'<path d="M4 12h16"/>','livro':'<path d="M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3ZM12 5v17"/>','filtro':'<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>'}
for name,paths in icons.items():
 Path(f'design/icones/{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')
# Diagrammed campaign pieces with editable vector typography and original brand paths.
logo=Path('design/logos/logo-original.svg').read_text()
logo_inner=logo[logo.index('>')+1:logo.rfind('</')]
logo_element=f'<svg x="60" y="45" width="330" height="70" viewBox="195 365 865 180">{logo_inner}</svg>' 
def piece(path,w,h,image,title,subtitle):
 portrait=h>=w
 data='data:image/png;base64,'+base64.b64encode(Path(image).read_bytes()).decode()
 size=80 if portrait else 70
 header=520 if len(title.split("|"))>2 else 450
 if portrait:
  image_el=f'<image href="{data}" x="0" y="{header-10}" width="{w}" height="{h-header+10}" preserveAspectRatio="xMidYMid slice"/>'
  overlay=f'<rect width="{w}" height="{header}" fill="#08151b"/>'
 else:
  image_el=f'<image href="{data}" x="{int(w*.42)}" y="0" width="{int(w*.58)}" height="{h}" preserveAspectRatio="xMidYMid slice"/>'
  overlay=f'<rect width="{int(w*.46)}" height="{h}" fill="#08151b"/>'
 lines=title.split('|'); texts=''.join(f'<text x="60" y="{220+i*size}" font-size="{size}" fill="{("#73d4e7" if i==len(lines)-1 else "white")}" font-weight="700" font-family="DejaVu Sans,sans-serif">{html.escape(line)}</text>' for i,line in enumerate(lines))
 if not portrait:
  size=65;texts=''.join(f'<text x="60" y="{230+i*72}" font-size="{size}" fill="{("#73d4e7" if i==len(lines)-1 else "white")}" font-weight="700" font-family="DejaVu Sans,sans-serif">{html.escape(line)}</text>' for i,line in enumerate(lines))
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="#08151b"/>{image_el}{overlay}{logo_element}{texts}<text x="60" y="{220+(len(lines)-1)*size+65 if portrait else h-110}" fill="#dbe6e7" font-size="22" font-family="DejaVu Sans,sans-serif">{subtitle}</text><rect x="0" y="{h-50}" width="{w}" height="50" fill="#08151b"/><text x="35" y="{h-18}" fill="#a5b8bd" font-size="15" font-family="DejaVu Sans,sans-serif">CONCEITO VISUAL · IMAGEM ILUSTRATIVA · COLEÇÃO EM DESENVOLVIMENTO</text></svg>'
 # CairoSVG supports xlink consistently.
 svg=svg.replace(' href=', ' xlink:href=')
 Path(path+'.svg').write_text(svg)
 cairosvg.svg2png(bytestring=svg.encode(),write_to=path+'.png')
piece('design/anuncios/camiseta-feed',1080,1350,'design/mockups/camiseta.png','VISTA O|PROPÓSITO.','Coleção Guerreiros / Vestuário')
piece('design/anuncios/kit-quadrado',1080,1080,'design/mockups/kit.png','UM PRESENTE.|UM LEGADO.','Coleção Guerreiros / Presentes')
piece('design/anuncios/garrafa-story',1080,1920,'design/mockups/garrafa.png','LEVE O|ESSENCIAL.','Coleção Guerreiros / Essenciais')
piece('design/banners/colecao-desktop',1920,800,'design/banners/hero-jornada.png','A JORNADA|FORJA O|GUERREIRO.','Fé para caminhar. Coragem para viver.')
piece('design/banners/colecao-mobile',1080,1350,'design/banners/hero-jornada.png','A JORNADA|FORJA O|GUERREIRO.','Fé. Coragem. Propósito.')
piece('design/banners/kit-presente',1600,700,'design/mockups/kit.png','COMPARTILHE|A JORNADA.','Presentes com significado / Guerreiros')
Path('design/tokens/tokens.css').write_text(':root{--ink:#191e37;--deep:#08151b;--cyan:#73d4e7;--paper:#f5f3ed;--white:#fff;--text:#182329;--muted:#58666c;--line:#d8ddd9;}\n')
for folder in ['logos','favicons','mockups','banners']:
 shutil.copytree(root/'design'/folder,root/'static/design'/folder,dirs_exist_ok=True)
# Contact sheet for quality assurance only.
thumbs=[]
for p in [Path('design/banners/hero-jornada.png')]+list(Path('design/mockups').glob('*.png'))+list(Path('design/anuncios').glob('*.png')):
 im=Image.open(p).convert('RGB');im.thumbnail((350,300));tile=Image.new('RGB',(380,340),'#eceee8');tile.paste(im,((380-im.width)//2,10));
 from PIL import ImageDraw
 ImageDraw.Draw(tile).text((12,318),p.stem,fill='#182329');thumbs.append(tile)
sheet=Image.new('RGB',(380*4,340*2),'#eceee8')
for i,tile in enumerate(thumbs):sheet.paste(tile,((i%4)*380,(i//4)*340))
sheet.save('design/preview/contato.png')
print('Assets exportados e copiados para a aplicação.')
