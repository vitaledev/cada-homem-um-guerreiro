from decimal import Decimal
from django.contrib import messages
from django.db.models import Q
from django.core.paginator import Paginator
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.http import require_POST, require_GET
from .models import Category, Product, Variant
from .forms import CartForm


def home(request):
    products = Product.objects.filter(active=True, featured=True).select_related('category')[:4]
    return render(request, 'shop/home.html', {'products': products})


def catalog(request):
    products = Product.objects.filter(active=True).select_related('category')
    query = request.GET.get('q', '')[:100].strip()
    category = request.GET.get('categoria', '')[:80]
    if query: products = products.filter(Q(title__icontains=query) | Q(description__icontains=query) | Q(sku__icontains=query))
    if category: products = products.filter(category__slug=category)
    sort = request.GET.get('ordem', 'novidades')
    products = products.order_by({'menor-preco': 'price', 'maior-preco': '-price', 'nome': 'title'}.get(sort, '-created_at'))
    page = Paginator(products, 24).get_page(request.GET.get('pagina'))
    return render(request, 'shop/catalog.html', {'page': page, 'query': query, 'selected_category': category, 'sort': sort})


def product(request, slug):
    item = get_object_or_404(Product.objects.prefetch_related('variants', 'gallery'), slug=slug, active=True)
    related = Product.objects.filter(active=True, category=item.category).exclude(pk=item.pk)[:4]
    return render(request, 'shop/product.html', {'product': item, 'related': related})


def cart_items(request):
    cart = request.session.get('cart', {})
    items, total = [], Decimal('0')
    products = {p.pk: p for p in Product.objects.filter(active=True, pk__in=[v.get('product') for v in cart.values()])}
    variants = {v.pk: v for v in Variant.objects.filter(pk__in=[v.get('variant') for v in cart.values() if v.get('variant')])}
    for key, entry in cart.items():
        p = products.get(entry.get('product'))
        if not p: continue
        v = variants.get(entry.get('variant')) if entry.get('variant') else None
        if entry.get('variant') and (not v or v.product_id != p.pk): continue
        quantity = max(1, min(20, int(entry.get('quantity', 1))))
        price = v.price if v and v.price is not None else p.price
        stock = v.stock if v else p.stock
        subtotal = price * quantity
        items.append({'key': key, 'product': p, 'variant': v, 'quantity': quantity, 'price': price,
                      'subtotal': subtotal, 'stock': stock, 'unavailable': quantity > stock})
        total += subtotal
    return items, total


def cart(request):
    items, total = cart_items(request)
    return render(request, 'shop/cart.html', {'items': items, 'total': total})


@require_POST
def cart_add(request, pk):
    p = get_object_or_404(Product, pk=pk, active=True)
    form = CartForm(request.POST)
    if not form.is_valid():
        messages.error(request, 'Informe uma quantidade entre 1 e 20.')
        return redirect(p)
    variant_id = form.cleaned_data.get('variant')
    variants = p.variants.all()
    v = get_object_or_404(variants, pk=variant_id) if variant_id else None
    if variants.exists() and not v:
        messages.error(request, 'Selecione uma variação antes de adicionar.')
        return redirect(p)
    stock = v.stock if v else p.stock
    key = f'{p.pk}:{v.pk if v else 0}'
    cart = request.session.get('cart', {})
    quantity = cart.get(key, {}).get('quantity', 0) + form.cleaned_data['quantity']
    if quantity > min(stock, 20):
        messages.error(request, 'A quantidade supera a disponibilidade ou o limite de 20 unidades.')
        return redirect(p)
    if key not in cart and len(cart) >= 50:
        messages.error(request, 'Sua sacola atingiu o limite de itens diferentes.')
        return redirect('cart')
    cart[key] = {'product': p.pk, 'variant': v.pk if v else None, 'quantity': quantity}
    request.session['cart'] = cart
    messages.success(request, 'Produto adicionado à sacola.')
    return redirect('cart')


@require_POST
def cart_update(request, key):
    cart = request.session.get('cart', {})
    if key not in cart: return redirect('cart')
    if request.POST.get('action') == 'remove':
        del cart[key]
    else:
        form = CartForm(request.POST)
        if not form.is_valid():
            messages.error(request, 'Quantidade inválida.')
            return redirect('cart')
        entry = cart[key]
        p = get_object_or_404(Product, pk=entry['product'], active=True)
        v = get_object_or_404(Variant, pk=entry['variant'], product=p) if entry.get('variant') else None
        stock = v.stock if v else p.stock
        if form.cleaned_data['quantity'] > stock:
            messages.error(request, 'Quantidade indisponível no estoque.')
            return redirect('cart')
        entry['quantity'] = form.cleaned_data['quantity']
    request.session['cart'] = cart
    return redirect('cart')


@require_GET
def health(request):
    return HttpResponse('ok', content_type='text/plain')


def about(request):
    return render(request, 'shop/about.html')


def robots(request):
    return HttpResponse('User-agent: *\nDisallow: /admin/\nDisallow: /carrinho/\nDisallow: /loja/?\n', content_type='text/plain')
