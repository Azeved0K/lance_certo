from django.contrib import admin
from .models import Momento, Tag, Like, Comentario, Notificacao

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['nome', 'slug', 'total_momentos', 'created_at']
    search_fields = ['nome', 'slug']
    prepopulated_fields = {'slug': ('nome',)}
    ordering = ['nome']

    def total_momentos(self, obj):
        return obj.momentos.count()
    total_momentos.short_description = 'Total de Momentos'

@admin.register(Momento)
class MomentoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'usuario', 'views', 'total_likes', 'total_comentarios', 'created_at']
    list_filter = ['created_at', 'tags']
    search_fields = ['titulo', 'descricao', 'usuario__username']
    readonly_fields = ['views', 'created_at', 'updated_at', 'total_likes', 'total_comentarios']
    filter_horizontal = ['tags']
    ordering = ['-created_at']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('usuario', 'titulo', 'descricao')
        }),
        ('Mídia', {
            'fields': ('video', 'thumbnail', 'duracao')
        }),
        ('Organização', {
            'fields': ('tags',)
        }),
        ('Estatísticas', {
            'fields': ('views', 'total_likes', 'total_comentarios', 'created_at', 'updated_at')
        }),
    )

    def total_comentarios(self, obj):
        return obj.comentarios.count()
    total_comentarios.short_description = 'Total de Comentários'

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'momento', 'created_at']
    list_filter = ['created_at']
    search_fields = ['usuario__username', 'momento__titulo']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        # Prevenir criação manual via admin (likes devem vir da API)
        return False

@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'momento', 'texto_resumido', 'created_at']
    list_filter = ['created_at']
    search_fields = ['usuario__username', 'momento__titulo', 'texto']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def texto_resumido(self, obj):
        return obj.texto[:50] + '...' if len(obj.texto) > 50 else obj.texto
    texto_resumido.short_description = 'Texto'

@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    list_display = ['usuario_destino', 'tipo', 'mensagem_resumida', 'lida', 'created_at']
    list_filter = ['tipo', 'lida', 'created_at']
    search_fields = ['usuario_destino__username', 'mensagem']
    readonly_fields = ['created_at']

    def mensagem_resumida(self, obj):
        return obj.mensagem[:75] + '...' if len(obj.mensagem) > 75 else obj.mensagem

    mensagem_resumida.short_description = 'Mensagem'