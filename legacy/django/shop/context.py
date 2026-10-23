from .models import Category

def brand(request):
    cart = request.session.get('cart', {})
    return {'nav_categories': Category.objects.all(),
            'cart_count': sum(item.get('quantity', 0) for item in cart.values())}
