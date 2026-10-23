from decimal import Decimal
from django.db import models
from django.db.models import Q, F
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.urls import reverse

class Category(models.Model):
    name = models.CharField('nome', max_length=80)
    slug = models.SlugField(unique=True)
    order = models.PositiveIntegerField('ordem', default=0)
    class Meta:
        verbose_name = 'categoria'
        ordering = ['order', 'name']
    def __str__(self): return self.name

class Product(models.Model):
    title = models.CharField('nome do produto', max_length=160)
    slug = models.SlugField('endereço', unique=True, max_length=180)
    sku = models.CharField('SKU', unique=True, max_length=64)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, verbose_name='categoria')
    subtitle = models.CharField('subtítulo', max_length=160, blank=True)
    description = models.TextField('descrição')
    price = models.DecimalField('preço (R$)', max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    compare_price = models.DecimalField('preço anterior (R$)', max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField('imagem principal', upload_to='produtos/', blank=True)
    demo_image = models.CharField('arquivo conceitual local', max_length=100, blank=True, editable=False)
    image_alt = models.CharField('descrição da imagem', max_length=180, blank=True)
    stock = models.PositiveIntegerField('estoque sem variação', default=0)
    active = models.BooleanField('publicado', default=False)
    featured = models.BooleanField('destaque na home', default=False)
    conceptual = models.BooleanField('produto conceitual', default=False)
    created_at = models.DateTimeField('criado em', auto_now_add=True)
    updated_at = models.DateTimeField('atualizado em', auto_now=True)
    class Meta:
        verbose_name = 'produto'
        ordering = ['-created_at']
        constraints = [models.CheckConstraint(condition=Q(price__gt=0), name='product_positive_price'),
                       models.CheckConstraint(condition=Q(compare_price__isnull=True) | Q(compare_price__gt=F('price')), name='product_compare_price')]
    def clean(self):
        if self.price is not None and self.compare_price is not None and self.compare_price <= self.price:
            raise ValidationError({'compare_price': 'O preço anterior deve ser maior que o preço atual.'})
    def __str__(self): return self.title
    def get_absolute_url(self): return reverse('product', args=[self.slug])
    @property
    def image_url(self):
        if self.image: return self.image.url
        if self.demo_image: return '/static/design/mockups/' + self.demo_image
        return '/static/design/logos/simbolo-escuro.svg'

class Variant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants', verbose_name='produto')
    name = models.CharField('variação / tamanho / cor', max_length=100)
    sku = models.CharField('SKU', max_length=80, unique=True)
    stock = models.PositiveIntegerField('estoque', default=0)
    price = models.DecimalField('preço específico (opcional)', max_digits=10, decimal_places=2, blank=True, null=True,
                                validators=[MinValueValidator(Decimal('0.01'))])
    class Meta:
        verbose_name = 'variação'
        verbose_name_plural = 'variações'
        constraints = [models.CheckConstraint(condition=Q(price__isnull=True) | Q(price__gt=0), name='variant_positive_price')]
    def __str__(self): return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery', verbose_name='produto')
    image = models.ImageField('imagem', upload_to='produtos/')
    alt = models.CharField('descrição da imagem', max_length=180)
    order = models.PositiveIntegerField('ordem', default=0)
    class Meta:
        verbose_name = 'imagem adicional'
        verbose_name_plural = 'imagens adicionais'
        ordering = ['order']
    def __str__(self): return self.alt
