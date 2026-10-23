import warnings
from io import BytesIO
from uuid import uuid4
from PIL import Image, UnidentifiedImageError
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile

Image.MAX_IMAGE_PIXELS = 20_000_000

def clean_image(upload):
    if upload.size > 5 * 1024 * 1024:
        raise ValidationError('A imagem deve ter no máximo 5 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            upload.seek(0)
            with Image.open(upload) as source:
                if source.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise ValidationError('Envie JPG, PNG ou WebP.')
                source.load()
                if source.width * source.height > 20_000_000:
                    raise ValidationError('A imagem deve ter no máximo 20 megapixels.')
                image = source.convert('RGB')
                image.thumbnail((2400, 2400))
                out = BytesIO()
                image.save(out, 'WEBP', quality=90)
        return ContentFile(out.getvalue(), name=f'{uuid4().hex}.webp')
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise ValidationError('Arquivo de imagem inválido ou grande demais.')
    finally:
        upload.seek(0)
