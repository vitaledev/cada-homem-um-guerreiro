import json
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from shop.models import Category, Product, Variant


class Command(BaseCommand):
    help = 'Adiciona os 16 produtos identificados na montagem enviada, sem sobrescrever os existentes.'

    def handle(self, *args, **options):
        manifest = settings.BASE_DIR / 'design' / 'catalogo-referencia.json'
        rows = json.loads(manifest.read_text())['products']
        root = settings.BASE_DIR / 'design' / 'mockups' / 'catalogo-referencia'
        missing = [row['image'] for row in rows if not (root / (row['image']+'.webp')).is_file()]
        if missing:
            raise CommandError('Faltam imagens: '+', '.join(missing))
        categories = {}
        with transaction.atomic():
            for order, (slug, name) in enumerate([('vestuario','Vestuário'),('acessorios','Acessórios'),('kits','Kits & presentes'),('livros','Livros'),('biblias','Bíblias')]):
                categories[slug], _ = Category.objects.get_or_create(slug=slug, defaults={'name':name,'order':order})
            created_count=0
            # Os lançamentos de livros ficam entre os produtos mais recentes.
            for row in reversed(rows):
                product, created = Product.objects.get_or_create(sku=row['sku'], defaults={
                    'title':row['title'],'slug':row['slug'],'category':categories[row['category']],
                    'subtitle':row['subtitle'],'price':row['price'],'description':row['description'],
                    'demo_image':'catalogo-referencia/'+row['image']+'.webp',
                    'image_alt':'Mockup de '+row['title']+' conforme a referência enviada',
                    'stock':12,'active':True,'featured':row['featured'],'conceptual':True,
                })
                if created:
                    created_count+=1
                    if row['category']=='vestuario':
                        for size in ['P','M','G','GG']:
                            Variant.objects.create(product=product,name=('Azul-marinho' if row['image']=='camiseta-logo-oficial' else 'Preta')+' / '+size,
                                                   sku=row['sku']+'-'+size,stock=5)
                self.stdout.write(('Adicionado: ' if created else 'Preservado: ')+product.title)
        self.stdout.write(self.style.SUCCESS(f'{created_count} produtos adicionados. Cadastros existentes preservados.'))
