from django import forms
from .models import Product, ProductImage
from .uploads import clean_image

class SafeImageForm(forms.ModelForm):
    def clean_image(self):
        value = self.cleaned_data.get('image')
        if value and (hasattr(value, 'temporary_file_path') or hasattr(value, 'content_type')):
            return clean_image(value)
        return value

class ProductForm(SafeImageForm):
    class Meta:
        model = Product
        fields = '__all__'

class ProductImageForm(SafeImageForm):
    class Meta:
        model = ProductImage
        fields = '__all__'

class CartForm(forms.Form):
    quantity = forms.IntegerField(min_value=1, max_value=20, initial=1)
    variant = forms.IntegerField(required=False, min_value=1)
