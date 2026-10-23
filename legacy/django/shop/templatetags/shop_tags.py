from django import template
register = template.Library()
@register.filter
def brl(value):
    return f'R$ {value:,.2f}'.replace(',', '_').replace('.', ',').replace('_', '.')
