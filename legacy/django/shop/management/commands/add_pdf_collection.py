from pathlib import Path
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from shop.models import Category, Product, Variant, ProductImage


class Command(BaseCommand):
    help = 'Acrescenta camiseta e boné baseados no PDF, preservando os produtos existentes.'

    def handle(self, *args, **options):
        source = settings.BASE_DIR / 'design' / 'mockups' / 'colecao-pdf'
        specs = [
            {
                'sku': 'REF-PDF-CAM-01', 'slug': 'camiseta-guerreiros-estampa-original',
                'title': 'Camiseta Guerreiros — Estampa Original',
                'subtitle': 'Peito, costas, manga e lateral. A identidade completa.',
                'price': '89.90', 'file': 'camiseta-original', 'sizes': ['P', 'M', 'G', 'GG'],
                'description': 'Modelo baseado nas páginas 1 a 4 e 6 do PDF de referência.\n\n'
                    'Frente: assinatura Cada Homem Um Guerreiro, com lettering branco, linha superior em ciano e escudo branco. '
                    'Manga direita: escudo G em ciano. Lateral: escudo de grande formato em contorno ciano, envolvendo frente e costas.\n\n'
                    'Costas: escudo ciano na parte superior e a inscrição SI VIS PACEM PARA BELLUM em branco, como no arquivo original.\n\n'
                    'Cor azul-marinho. As imagens de estúdio são mockups; o layout original do PDF está incluído na galeria para comparação. '
                    'Preço, tamanhos e estoque são demonstrativos. Composição, medidas e técnica de produção dependem da ficha final do fornecedor.',
                'reference': 'layout-camiseta-pdf.png',
            },
            {
                'sku': 'REF-PDF-BON-01', 'slug': 'bone-guerreiros-bordado-original',
                'title': 'Boné Guerreiros — Bordado Original',
                'subtitle': 'Escudo à frente. Propósito em cada detalhe.',
                'price': '79.90', 'file': 'bone-original', 'sizes': ['Ajustável'],
                'description': 'Modelo baseado nas páginas 5 e 7 do PDF de referência.\n\n'
                    'Frente: escudo G bordado em ciano com contorno branco. '
                    'Parte traseira: bordado branco em duas linhas, SI VIS PACEM / PARA BELLUM, posicionado acima da abertura de ajuste.\n\n'
                    'Boné azul-marinho com aba curva e ajuste traseiro, conforme o layout. '
                    'As imagens de estúdio são mockups; a apresentação original do PDF está incluída na galeria para comparação. '
                    'Preço e estoque demonstrativos. Material, medidas e acabamento de fabricação devem ser confirmados com o fornecedor.',
                'reference': 'layout-bone-pdf.png',
            },
        ]
        for spec in specs:
            for suffix in ['frente', 'costas']:
                if not (source / f'{spec["file"]}-{suffix}.webp').is_file():
                    raise CommandError(f'Imagem ainda não exportada: {spec["file"]}-{suffix}.webp')
        category, _ = Category.objects.get_or_create(slug='vestuario', defaults={'name': 'Vestuário', 'order': 0})
        created_count = 0
        for spec in specs:
            with transaction.atomic():
                product, created = Product.objects.get_or_create(sku=spec['sku'], defaults={
                    'title': spec['title'], 'slug': spec['slug'], 'category': category,
                    'subtitle': spec['subtitle'], 'description': spec['description'], 'price': spec['price'],
                    'demo_image': f'colecao-pdf/{spec["file"]}-frente.webp', 'image_alt': f'{spec["title"]}, vista frontal com a arte do PDF',
                    'stock': 10, 'active': True, 'featured': True, 'conceptual': True,
                })
                if created:
                    created_count += 1
                    for size in spec['sizes']:
                        Variant.objects.create(product=product, name=f'Azul-marinho / {size}', sku=f'{spec["sku"]}-{size}', stock=5)
                gallery = [
                    (source / f'{spec["file"]}-costas.webp', f'{spec["title"]} — vista traseira', 0),
                    (settings.BASE_DIR / 'design' / 'estampas-originais' / spec['reference'], 'Layout original do PDF de referência — frente e costas', 1),
                ]
                for file, alt, order in gallery:
                    if not product.gallery.filter(alt=alt).exists():
                        image = ProductImage(product=product, alt=alt, order=order)
                        image.image.save(file.name, ContentFile(file.read_bytes()), save=True)
                self.stdout.write(f'{"Adicionado" if created else "Preservado"}: {product.title}')
        self.stdout.write(self.style.SUCCESS(f'{created_count} novos produtos. Catálogo anterior preservado.'))
