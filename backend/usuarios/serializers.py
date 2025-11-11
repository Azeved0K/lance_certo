from rest_framework import serializers
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer básico do usuário (dados públicos)"""
    total_momentos = serializers.ReadOnlyField()
    total_likes_recebidos = serializers.ReadOnlyField()
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
        # Retorna None se não houver avatar (o frontend usará o fallback da UI-Avatars)
        return None


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
    class Meta:
        model = Usuario
        fields = ['first_name', 'last_name', 'avatar', 'bio', 'data_nascimento', 'is_private']

class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)