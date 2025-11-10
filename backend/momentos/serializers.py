import json
from rest_framework import serializers
from .models import Momento, Tag, Like, Comentario, Notificacao
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
    total_likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

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
            'created_at'
        ]
        read_only_fields = ['id', 'views', 'created_at']

    def get_total_likes(self, obj):
        # Se a view anotou 'likes_count', usa esse valor
        if hasattr(obj, 'likes_count'):
            return obj.likes_count
        # Caso contrário, conta diretamente
        return obj.likes.count()

    def get_is_liked(self, obj):
        """Verifica se o usuário atual curtiu este momento"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(usuario=request.user, momento=obj).exists()
        return False

    def get_video(self, obj):
        """Retorna URL completa do vídeo"""
        request = self.context.get('request')
        if obj.video:
            return request.build_absolute_uri(obj.video.url) if request else obj.video.url
        return None

    def get_thumbnail(self, obj):
        """Retorna URL completa do thumbnail"""
        request = self.context.get('request')
        if obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None

class MomentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do momento (mais completo)"""
    usuario = UsuarioSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    total_likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comentarios = ComentarioSerializer(many=True, read_only=True)
    video = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

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

    def get_total_likes(self, obj):
        """Pega do campo anotado OU da property"""
        if hasattr(obj, 'likes_count'):
            return obj.likes_count
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(usuario=request.user, momento=obj).exists()
        return False

    def get_video(self, obj):
        """Retorna URL completa do vídeo"""
        request = self.context.get('request')
        if obj.video:
            return request.build_absolute_uri(obj.video.url) if request else obj.video.url
        return None

    def get_thumbnail(self, obj):
        """Retorna URL completa do thumbnail"""
        request = self.context.get('request')
        if obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None

class MomentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de momento"""
    # Recebe '["tag1", "tag2"]' como uma string JSON vinda do FormData
    tags = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True  # Permite string vazia
    )

    class Meta:
        model = Momento
        fields = ['titulo', 'descricao', 'video', 'thumbnail', 'duracao', 'tags']

    def create(self, validated_data):
        tags_json = validated_data.pop('tags', '[]')  # Pega a string JSON
        tags_data = []
        try:
            # Tenta decodificar o JSON string
            tags_data = json.loads(tags_json)
            if not isinstance(tags_data, list):
                tags_data = []
        except json.JSONDecodeError:
            # Se falhar (ex: string vazia ou mal formatada), ignora
            tags_data = []

        # Cria o momento com os campos restantes (video, thumbnail, etc.)
        momento = Momento.objects.create(**validated_data)

        # Criar ou buscar tags
        for tag_nome in tags_data:
            tag_nome = str(tag_nome).strip().lower()  # Garante que é string
            if tag_nome:
                tag, created = Tag.objects.get_or_create(
                    nome=tag_nome,
                    defaults={'slug': tag_nome.replace(' ', '-')}
                )
                momento.tags.add(tag)

        return momento

class MomentoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de momento"""
    # Este serializer é usado pelo 'Editar' no Card, que envia JSON
    # e não FormData, então ListField funciona bem aqui.
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

class NotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para Notificações"""
    usuario_origem = UsuarioSerializer(read_only=True)
    # Envia apenas o ID do momento para facilitar navegação no frontend
    momento_id = serializers.ReadOnlyField(source='momento.id')

    class Meta:
        model = Notificacao
        fields = [
            'id',
            'usuario_origem',
            'momento_id',
            'tipo',
            'mensagem',
            'lida',
            'created_at'
        ]
        read_only_fields = fields