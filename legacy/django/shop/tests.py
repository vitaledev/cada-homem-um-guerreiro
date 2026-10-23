from decimal import Decimal
from io import BytesIO
from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model
from django.contrib.admin.models import LogEntry
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from PIL import Image
from .models import Category, Product, Variant
from .forms import ProductForm
from .uploads import clean_image

class StoreTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name='Essenciais', slug='essenciais')
        cls.product = Product.objects.create(title='Caderno', slug='caderno', sku='CAD-TEST', category=cls.category,
                                            description='Texto seguro <script>alert(1)</script>', price='59.90', stock=3, active=True, featured=True)
        cls.hidden = Product.objects.create(title='Rascunho', slug='rascunho', sku='DRAFT', category=cls.category,
                                           description='oculto', price='10.00', stock=1)
        cls.admin = get_user_model().objects.create_superuser('test_admin', 'admin@example.invalid', 'Test-only-strong-password-123')
        cls.staff = get_user_model().objects.create_user('staff', password='Test-only-password-123', is_staff=True)

    def test_public_pages_and_escaped_content(self):
        for path in ['/', '/loja/', '/produto/caderno/', '/carrinho/', '/sobre/', '/saude/']:
            self.assertEqual(self.client.get(path).status_code, 200, path)
        response = self.client.get('/produto/caderno/')
        self.assertContains(response, '&lt;script&gt;')
        self.assertNotContains(response, '<script>alert(1)</script>')
        self.assertEqual(self.client.get('/produto/rascunho/').status_code, 404)
        self.assertNotContains(self.client.get('/loja/'), 'Rascunho')

    def test_price_cannot_be_supplied_by_client(self):
        self.client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': 2, 'price': '0.01'})
        response = self.client.get('/carrinho/')
        self.assertEqual(response.context['total'], Decimal('119.80'))
        self.product.price = Decimal('60.00'); self.product.save()
        self.assertEqual(self.client.get('/carrinho/').context['total'], Decimal('120.00'))

    def test_stock_quantity_and_method_limits(self):
        self.assertEqual(self.client.get(f'/carrinho/adicionar/{self.product.pk}/').status_code, 405)
        for quantity in [-1, 0, 4, 21, 'x']:
            self.client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': quantity})
            self.assertFalse(self.client.session.get('cart'))

    def test_variant_must_belong_to_product(self):
        variant = Variant.objects.create(product=self.hidden, sku='OTHER-M', name='M', stock=2)
        response = self.client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': 1, 'variant': variant.pk})
        self.assertEqual(response.status_code, 404)
        Variant.objects.create(product=self.product, sku='CAD-M', name='M', stock=2)
        self.client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': 1})
        self.assertFalse(self.client.session.get('cart'))

    def test_csrf_and_admin_permissions(self):
        csrf_client = Client(enforce_csrf_checks=True)
        self.assertEqual(csrf_client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': 1}).status_code, 403)
        self.assertEqual(self.client.get('/admin/shop/product/').status_code, 302)
        self.client.force_login(self.staff)
        self.assertEqual(self.client.get('/admin/shop/product/').status_code, 403)
        self.assertEqual(self.client.post('/admin/shop/product/add/', {}).status_code, 403)

    def test_admin_can_create_product_and_audit_is_written(self):
        self.client.force_login(self.admin)
        data = {'title': 'Produto novo', 'slug': 'produto-novo', 'sku': 'NEW-SKU', 'category': self.category.pk,
                'description': 'Descrição', 'price': '35.50', 'stock': 4, 'active': 'on',
                'variants-TOTAL_FORMS': '0', 'variants-INITIAL_FORMS': '0', 'variants-MIN_NUM_FORMS': '0', 'variants-MAX_NUM_FORMS': '1000',
                'gallery-TOTAL_FORMS': '0', 'gallery-INITIAL_FORMS': '0', 'gallery-MIN_NUM_FORMS': '0', 'gallery-MAX_NUM_FORMS': '1000'}
        response = self.client.post('/admin/shop/product/add/', data)
        self.assertEqual(response.status_code, 302)
        p = Product.objects.get(sku='NEW-SKU')
        self.assertContains(self.client.get(p.get_absolute_url()), 'Produto novo')
        self.assertTrue(LogEntry.objects.filter(user=self.admin, object_id=str(p.pk), action_flag=1).exists())
        data.update(title='Produto atualizado', **{'variants-TOTAL_FORMS': '0', 'gallery-TOTAL_FORMS': '0'})
        response = self.client.post(f'/admin/shop/product/{p.pk}/change/', data)
        self.assertEqual(response.status_code, 302)
        p.refresh_from_db(); self.assertEqual(p.title, 'Produto atualizado')

    def test_upload_rejects_active_content_and_reencodes_raster(self):
        bad = SimpleUploadedFile('image.svg', b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', content_type='image/svg+xml')
        with self.assertRaises(ValidationError): clean_image(bad)
        out = BytesIO(); Image.new('RGB', (20, 20), '#123456').save(out, 'PNG')
        result = clean_image(SimpleUploadedFile('valid.png', out.getvalue(), content_type='image/png'))
        self.assertTrue(result.name.endswith('.webp'))
        self.assertEqual(Image.open(result).format, 'WEBP')

    def test_cache_headers_and_csp(self):
        response = self.client.get('/carrinho/')
        self.assertIn('no-store', response['Cache-Control'])
        self.assertIn("script-src 'self'", response['Content-Security-Policy'])
        self.assertEqual(response['X-Frame-Options'], 'DENY')

    @override_settings(AXES_FAILURE_LIMIT=3)
    def test_admin_login_is_rate_limited(self):
        from axes.utils import reset
        reset()
        responses = [self.client.post('/admin/login/', {'username': 'not-a-user', 'password': 'incorrect', 'next': '/admin/'}) for _ in range(4)]
        self.assertEqual(responses[-1].status_code, 429)
        reset()

    def test_search_and_cart_removal(self):
        self.assertContains(self.client.get('/loja/?q=Caderno'), 'Caderno')
        self.assertContains(self.client.get('/loja/?q=missing-product'), 'Nenhum essencial')
        self.client.post(f'/carrinho/adicionar/{self.product.pk}/', {'quantity': 1})
        key = next(iter(self.client.session['cart']))
        self.client.post(f'/carrinho/alterar/{key}/', {'action': 'remove'})
        self.assertFalse(self.client.session['cart'])
