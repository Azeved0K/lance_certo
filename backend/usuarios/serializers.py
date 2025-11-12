from rest_framework import serializers
from django.contrib.auth import get_user_model
from momentos.validators import validate_avatar_size

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer básico do usuário (dados públicos)"""
    total_momentos = serializers.SerializerMethodField()
    total_likes_recebidos = serializers.SerializerMethodField() 
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'avatar',
            'bio',
            'data_nascimento',
            'total_momentos',
            'total_likes_recebidos',
            'created_at',
            'is_private'
        ]
        read_only_fields = ['id', 'created_at']

    def get_avatar(self, obj):
        """Retorna URL completa do avatar."""
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None
    
    def get_total_momentos(self, obj):
        """Retorna total de momentos considerando privacidade."""
        request = self.context.get('request')
        is_owner = request and request.user.is_authenticated and request.user == obj
        
        if is_owner:
            return obj.momentos.count()
        else:
            return obj.momentos.filter(is_private=False).count()

    def get_total_likes_recebidos(self, obj):
        """Retorna total de likes recebidos considerando privacidade."""
        request = self.context.get('request')
        is_owner = request and request.user.is_authenticated and request.user == obj
        
        if is_owner:
            return sum(momento.likes.count() for momento in obj.momentos.all())
        else:
            return sum(momento.likes.count() for momento in obj.momentos.filter(is_private=False))

class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de usuário (registro)"""
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['first_name', 'last_name', 'avatar', 'bio', 'data_nascimento', 'is_private']

    def validate(self, data):
        """Validação customizada"""
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'As senhas não coincidem'})
        return data

    def create(self, validated_data):
        """Cria o usuário com senha criptografada"""
        validated_data.pop('password2')
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de perfil"""
    avatar = serializers.ImageField(
        required=False,
        validators=[validate_avatar_size],
        help_text='Imagem de perfil (máximo 25MB)'
    )
    
    class Meta:
        model = Usuario
        fields = ['first_name', 'last_name', 'avatar', 'bio', 'data_nascimento', 'is_private']
    
    def validate_avatar(self, value):
        """Validação adicional do avatar"""
        if value:
            # Validar tamanho (25MB)
            if value.size > 25 * 1024 * 1024:
                raise serializers.ValidationError('A imagem deve ter no máximo 25MB')
            
            # Validar formato
            valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
            file_extension = value.name.lower().split('.')[-1]
            
            if file_extension not in valid_extensions:
                raise serializers.ValidationError('Formato inválido. Use JPG, PNG, GIF ou WEBP')
        
        return value

class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)