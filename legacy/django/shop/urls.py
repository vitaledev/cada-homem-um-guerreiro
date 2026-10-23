from django.urls import path
from . import views
urlpatterns = [path('', views.home, name='home'), path('loja/', views.catalog, name='catalog'),
               path('produto/<slug:slug>/', views.product, name='product'), path('carrinho/', views.cart, name='cart'),
               path('carrinho/adicionar/<int:pk>/', views.cart_add, name='cart_add'),
               path('carrinho/alterar/<str:key>/', views.cart_update, name='cart_update'),
               path('sobre/', views.about, name='about'), path('saude/', views.health), path('robots.txt', views.robots)]
