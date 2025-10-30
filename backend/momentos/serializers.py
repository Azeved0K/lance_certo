from rest_framework import serializers
from .models import Momento, Tag, Like, Comentario
from usuarios.serializers import UsuarioSerializer

class TagSerializer(serializers.ModelSerializer):
    """Serializer para Tags"""
    class Meta:
        model = Tag
        fields = ['id', 'nome', 'slug']
        read_only_fields = ['id', 'slug']

class ComentarioSerializer(serializers.ModelSerializer):
    """Serializer para Comentários"""
    usuario = UsuarioSerializer(read_only=True)
    
    class Meta:
        model = Comentario
        fields = ['id', 'usuario', 'texto', 'created_at', 'updated_at']
        read_only_fields = ['id', 'usuario', 'created_at', 'updated_at']

class MomentoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de momentos (mais leve)"""
    usuario = UsuarioSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    total_likes = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Momento
        fields = [
            'id',
            'titulo',
            'descricao',
            'thumbnail',
            'duracao',
            'views',
            'total_likes',
            'is_liked',
            'tags',
            'usuario',
            'created_at'
        ]
        read_only_fields = ['id', 'views', 'created_at']
    
    def get_is_liked(self, obj):
        """Verifica se o usuário atual curtiu este momento"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(usuario=request.user, momento=obj).exists()
        return False

class MomentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do momento (mais completo)"""
    usuario = UsuarioSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    total_likes = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comentarios = ComentarioSerializer(many=True, read_only=True)
    
    class Meta:
        model = Momento
        fields = [
            'id',
            'titulo',
            'descricao',
            'video',
            'thumbnail',
            'duracao',
            'views',
            'total_likes',
            'is_liked',
            'tags',
            'usuario',
            'comentarios',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'usuario', 'views', 'created_at', 'updated_at']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(usuario=request.user, momento=obj).exists()
        return False

class MomentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de momento"""
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Momento
        fields = ['titulo', 'descricao', 'video', 'thumbnail', 'duracao', 'tags']
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        momento = Momento.objects.create(**validated_data)
        
        # Criar ou buscar tags
        for tag_nome in tags_data:
            tag_nome = tag_nome.strip().lower()
            if tag_nome:
                tag, created = Tag.objects.get_or_create(
                    nome=tag_nome,
                    defaults={'slug': tag_nome.replace(' ', '-')}
                )
                momento.tags.add(tag)
        
        return momento

class MomentoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de momento"""
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Momento
        fields = ['titulo', 'descricao', 'thumbnail', 'tags']
    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        
        # Atualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualizar tags se fornecidas
        if tags_data is not None:
            instance.tags.clear()
            for tag_nome in tags_data:
                tag_nome = tag_nome.strip().lower()
                if tag_nome:
                    tag, created = Tag.objects.get_or_create(
                        nome=tag_nome,
                        defaults={'slug': tag_nome.replace(' ', '-')}
                    )
                    instance.tags.add(tag)
        
        return instance