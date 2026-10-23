from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Variant, ProductImage
from .forms import ProductForm, ProductImageForm

admin.site.site_header = 'Guerreiros · Gestão'
admin.site.site_title = 'Guerreiros Admin'
admin.site.index_title = 'Sua loja, sob seu controle'

class VariantInline(admin.TabularInline):
    model = Variant
    extra = 0

class ImageInline(admin.TabularInline):
    model = ProductImage
    form = ProductImageForm
    extra = 0

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductForm
    list_display = ['title', 'category', 'price', 'active', 'featured']
    list_filter = ['active', 'featured', 'category', 'conceptual']
    search_fields = ['title', 'sku', 'description']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'preview']
    inlines = [VariantInline, ImageInline]
    fieldsets = [('Identificação', {'fields': ('title', 'slug', 'sku', 'category', 'subtitle')}),
                 ('Conteúdo e imagem', {'fields': ('description', 'image', 'image_alt', 'preview')}),
                 ('Preço e disponibilidade', {'fields': ('price', 'compare_price', 'stock')}),
                 ('Publicação', {'fields': ('active', 'featured', 'conceptual')}),
                 ('Histórico', {'fields': ('created_at', 'updated_at')})]
    @admin.display(description='Prévia atual')
    def preview(self, obj):
        if not obj.pk: return 'Salve para visualizar.'
        return format_html('<img src="{}" alt="Prévia" width="160">', obj.image_url)
