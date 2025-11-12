"""
Validadores customizados para uploads
Localização: backend/momentos/validators.py
"""
from django.core.exceptions import ValidationError


def validate_avatar_size(file):
    """Valida o tamanho máximo do avatar (25MB)"""
    max_size = 25 * 1024 * 1024  # 25MB
    
    if file.size > max_size:
        size_mb = file.size / (1024 * 1024)
        raise ValidationError(
            f'O tamanho do arquivo não pode exceder 25MB. '
            f'Arquivo atual: {size_mb:.2f}MB'
        )


def validate_avatar_format(file):
    """Valida o formato do avatar (JPG, PNG, GIF, WEBP)"""
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    filename = file.name.lower()
    file_extension = '.' + filename.split('.')[-1] if '.' in filename else ''
    
    if file_extension not in valid_extensions:
        raise ValidationError(
            f'Formato inválido. Use JPG, PNG, GIF ou WEBP.'
        )


def validate_video_size(file):
    """Valida o tamanho máximo de vídeos (100MB)"""
    max_size = 100 * 1024 * 1024
    
    if file.size > max_size:
        size_mb = file.size / (1024 * 1024)
        raise ValidationError(
            f'O tamanho do vídeo não pode exceder 100MB. '
            f'Vídeo atual: {size_mb:.2f}MB'
        )


def validate_thumbnail_size(file):
    """Valida o tamanho máximo de thumbnails (5MB)"""
    max_size = 5 * 1024 * 1024
    
    if file.size > max_size:
        size_mb = file.size / (1024 * 1024)
        raise ValidationError(
            f'O tamanho do thumbnail não pode exceder 5MB. '
            f'Arquivo atual: {size_mb:.2f}MB'
        )