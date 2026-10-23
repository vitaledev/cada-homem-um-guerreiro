"""Exporta imagens já geradas para WebP; não chama serviço de IA."""
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
specs = json.loads((ROOT/'design/prompts/catalogo-referencia.json').read_text())['assets']
output = ROOT/'design/mockups/catalogo-referencia'
output.mkdir(parents=True, exist_ok=True)
contact = Image.new('RGB', (1200, 1320), '#f5f3ed')
for index, spec in enumerate(specs):
    source = output/(spec['name']+'.png')
    if not source.exists():
        shutil.copy2(spec['generated_file'], source)
    image = Image.open(source).convert('RGB')
    image.thumbnail((1200, 1200))
    image.save(source.with_suffix('.webp'), quality=88, method=6)
    thumb = image.copy()
    thumb.thumbnail((270, 270))
    x,y=(index%4)*300,(index//4)*330
    contact.paste(thumb,(x+(300-thumb.width)//2,y+10))
    ImageDraw.Draw(contact).text((x+12,y+290),spec['name'],fill='#182329')
shutil.copytree(output,ROOT/'static/design/mockups/catalogo-referencia',dirs_exist_ok=True)
contact.save(ROOT/'design/preview/catalogo-referencia-contato.jpg',quality=90)
print(f'{len(specs)} imagens exportadas.')
