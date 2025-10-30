from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='E-mail')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='Avatar')
    bio = models.TextField(max_length=500, blank=True, verbose_name='Biografia')
    data_nascimento = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
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