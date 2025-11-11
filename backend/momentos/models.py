from django.db import models
from django.conf import settings

class Tag(models.Model):
    nome = models.CharField(max_length=50, unique=True, verbose_name='Nome')
    slug = models.SlugField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['nome']

    def __str__(self):
        return self.nome

class Momento(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='momentos',
        verbose_name='Usuário'
    )
    titulo = models.CharField(max_length=200, verbose_name='Título')
    descricao = models.TextField(max_length=1000, blank=True, verbose_name='Descrição')
    video = models.FileField(upload_to='videos/%Y/%m/', verbose_name='Vídeo')
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/', blank=True, verbose_name='Thumbnail')
    duracao = models.IntegerField(default=0, verbose_name='Duração (segundos)')
    views = models.IntegerField(default=0, verbose_name='Visualizações')
    tags = models.ManyToManyField(Tag, related_name='momentos', blank=True, verbose_name='Tags')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Momento'
        verbose_name_plural = 'Momentos'
        ordering = ['-created_at']

    def __str__(self):
        return self.titulo

    @property
    def total_likes(self):
        return self.likes.count()

    def incrementar_views(self):
        self.views += 1
        self.save(update_fields=['views'])

class Like(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name='Usuário'
    )
    momento = models.ForeignKey(
        Momento,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name='Momento'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'
        unique_together = ['usuario', 'momento']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.usuario.username} curtiu {self.momento.titulo}'

class Comentario(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Usuário'
    )
    momento = models.ForeignKey(
        Momento,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Momento'
    )
    texto = models.TextField(max_length=500, verbose_name='Texto')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Comentário'
        verbose_name_plural = 'Comentários'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.usuario.username} comentou em {self.momento.titulo}'

class Notificacao(models.Model):
    TIPO_CHOICES = (
        ('like', 'Like'),
        ('view_milestone', 'Marco de Visualizações'),
        ('comentario', 'Comentário'),  # Já preparando para o futuro
    )

    usuario_destino = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        verbose_name='Usuário de Destino (Dono)'
    )
    usuario_origem = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes_criadas',
        null=True, blank=True,  # Nem toda notificação tem origem (ex: views)
        verbose_name='Usuário de Origem (Ação)'
    )
    momento = models.ForeignKey(
        Momento,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        null=True, blank=True,
        verbose_name='Momento relacionado'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name='Tipo')
    mensagem = models.TextField(max_length=500, verbose_name='Mensagem')
    lida = models.BooleanField(default=False, verbose_name='Lida')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-created_at']

    def __str__(self):
        return f'Notificação para {self.usuario_destino.username}: {self.tipo}'