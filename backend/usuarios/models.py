from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='E-mail')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='Avatar')
    bio = models.TextField(max_length=500, blank=True, verbose_name='Biografia')
    data_nascimento = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    is_private = models.BooleanField(default=False, verbose_name='Perfil Privado')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuario_set', # Nome único para os grupos
        blank=True,
        help_text='The groups this user belongs to.'
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuario_permissions', # Nome único para as permissões
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