from django.core.management.base import BaseCommand
from shop.models import Category, Product, Variant

class Command(BaseCommand):
    help = 'Cria catálogo conceitual sem alterar registros existentes ou criar usuários.'
    def handle(self, *args, **options):
        categories = {}
        for order, (name, slug) in enumerate([('Vestuário', 'vestuario'), ('Acessórios', 'acessorios'), ('Kits & presentes', 'kits'), ('Livros', 'livros'), ('Bíblias', 'biblias')]):
            categories[slug], _ = Category.objects.get_or_create(slug=slug, defaults={'name': name, 'order': order})
        products = [
            ('Camiseta Essência', 'camiseta-essencia', 'DEMO-CAM-01', 'vestuario', 'O propósito veste bem.', '89.90', 'camiseta.webp', 'Uma proposta de camiseta com o símbolo original da marca. O tecido, a modelagem e as medidas serão definidos com o fornecedor. Mockup conceitual, sem disponibilidade comercial confirmada.'),
            ('Garrafa Jornada', 'garrafa-jornada', 'DEMO-GAR-01', 'acessorios', 'O essencial, sempre por perto.', '119.90', 'garrafa.webp', 'Conceito de garrafa com acabamento fosco e assinatura Guerreiros. Capacidade e desempenho térmico dependem da definição do produto real.'),
            ('Caderno Propósito', 'caderno-proposito', 'DEMO-CAD-01', 'acessorios', 'Dê forma ao que move você.', '69.90', 'caderno.webp', 'Um lugar para ideias, reflexões e próximos passos. Proposta visual de caderno da marca. Papel, formato e acabamento ainda não definidos.'),
            ('Kit Legado', 'kit-legado', 'DEMO-KIT-01', 'kits', 'Compartilhe o que faz sentido.', '249.90', 'kit.webp', 'Proposta de presente que reúne os essenciais da jornada em uma caixa especial. Composição ilustrativa, a confirmar com o catálogo real.'),
        ]
        for title, slug, sku, cat, subtitle, price, image, description in products:
            p, created = Product.objects.get_or_create(sku=sku, defaults={'title': title, 'slug': slug, 'category': categories[cat], 'subtitle': subtitle,
                 'price': price, 'demo_image': image, 'description': description, 'stock': 12, 'active': True, 'featured': True, 'conceptual': True,
                 'image_alt': f'Mockup conceitual {title} com o símbolo Guerreiros'})
            if created and cat == 'vestuario':
                for size in ['P', 'M', 'G', 'GG']:
                    Variant.objects.create(product=p, name=f'Azul-marinho / {size}', sku=f'{sku}-{size}', stock=5)
        self.stdout.write(self.style.SUCCESS('Catálogo conceitual pronto. Nenhum usuário foi criado.'))
