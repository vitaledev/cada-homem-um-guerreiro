"""Exportação pontual e privada do banco legado antes da migração."""
import os,sys,json,sqlite3,hashlib
from pathlib import Path
from decimal import Decimal
root=Path(__file__).resolve().parent.parent
legacy=root if (root/'config').exists() else root/'legacy/django'
sys.path.insert(0,str(legacy))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django;django.setup()
from shop.models import Category,Product
from django.contrib.auth import get_user_model
from django.contrib.admin.models import LogEntry
from django.contrib.sessions.models import Session
from django.utils import timezone
out=root/'data/migration';out.mkdir(parents=True,exist_ok=True);os.chmod(out,0o700)
with sqlite3.connect(legacy/'db.sqlite3') as src,sqlite3.connect(out/'django-backup.sqlite3') as dst:src.backup(dst)
def cents(v):return int(Decimal(str(v))*100) if v is not None else None
products=[]
for p in Product.objects.prefetch_related('variants','gallery').all():
 products.append(dict(id=p.pk,title=p.title,slug=p.slug,sku=p.sku,categoryId=p.category_id,subtitle=p.subtitle,description=p.description,priceCents=cents(p.price),comparePriceCents=cents(p.compare_price),imageUrl=p.image_url,imageAlt=p.image_alt,stock=p.stock,active=p.active,featured=p.featured,conceptual=p.conceptual,createdAt=p.created_at.isoformat(),updatedAt=p.updated_at.isoformat(),variants=[dict(id=v.pk,name=v.name,sku=v.sku,stock=v.stock,priceCents=cents(v.price)) for v in p.variants.all()],gallery=[dict(id=i.pk,url=i.image.url,alt=i.alt,order=i.order) for i in p.gallery.all()]))
users=[dict(id=u.pk,username=u.username,passwordHash=u.password,active=u.is_active,role='ADMIN' if u.is_superuser else 'EDITOR',canManageCatalog=u.is_superuser or (u.has_perm('shop.change_product') and u.has_perm('shop.add_product'))) for u in get_user_model().objects.filter(is_staff=True)]
cart_sessions=[]
for s in Session.objects.filter(expire_date__gt=timezone.now()):
 d=s.get_decoded()
 if d.get('cart'):cart_sessions.append(dict(legacyHash=hashlib.sha256(s.session_key.encode()).hexdigest(),expiresAt=s.expire_date.isoformat(),cart=d['cart']))
result=dict(categories=list(Category.objects.values('id','name','slug','order')),products=products,users=users,carts=cart_sessions,audit=[dict(id=a.pk,userId=a.user_id,objectId=a.object_id,objectRepr=a.object_repr,action=a.action_flag,changes=a.change_message,createdAt=a.action_time.isoformat()) for a in LogEntry.objects.all()])
p=out/'django-export.json';p.touch(mode=0o600);p.write_text(json.dumps(result,ensure_ascii=False,indent=2));os.chmod(out/'django-backup.sqlite3',0o600)
print(f'Exportação privada: {len(products)} produtos, {len(result["categories"])} categorias. Backup preservado.')
