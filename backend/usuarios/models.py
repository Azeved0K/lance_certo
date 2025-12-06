from django.contrib.auth.models import AbstractUser
from django.db import models
from momentos.validators import validate_avatar_size, validate_avatar_format

class Usuario(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='E-mail')
    avatar = models.ImageField(
        upload_to='avatars/', 
        null=True, 
        blank=True, 
        verbose_name='Avatar',
        validators=[validate_avatar_size, validate_avatar_format],
        help_text='Imagem de perfil (máximo 25MB)'
    )
    bio = models.TextField(max_length=500, blank=True, verbose_name='Biografia')
    data_nascimento = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    is_private = models.BooleanField(default=False, verbose_name='Perfil Privado')
    password_reset_code = models.CharField(max_length=10, blank=True, null=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_attempts = models.IntegerField(default=0)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuario_set',
        blank=True,
        help_text='The groups this user belongs to.'
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuario_permissions',
        blank=True,
        help_text='Specific permissions for this user.'
    )

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    @property
    def total_momentos(self):
        return self.momentos.count()
    
    @property
    def total_likes_recebidos(self):
        return sum(momento.likes.count() for momento in self.momentos.all())