from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'total_momentos', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {
            'fields': ('avatar', 'bio', 'data_nascimento')
        }),
        ('Estatísticas', {
            'fields': ('total_momentos', 'total_likes_recebidos')
        }),
    )
    
    readonly_fields = ['total_momentos', 'total_likes_recebidos', 'created_at', 'updated_at']
    
    def total_momentos(self, obj):
        return obj.momentos.count()
    total_momentos.short_description = 'Total de Momentos'