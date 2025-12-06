from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from momentos.models import Momento
from momentos.serializers import MomentoListSerializer
from momentos.views import MomentoPagination
from rest_framework.pagination import PageNumberPagination
from .enviar_email import send_password_reset_email
import random

from .serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    UsuarioUpdateSerializer,
    LoginSerializer
)

Usuario = get_user_model()

class RegisterView(APIView):
    """
    POST /api/auth/register/
    Cria uma nova conta de usuário
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsuarioCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'message': 'Usuário criado com sucesso',
                    'user': UsuarioSerializer(user, context={'request': request}).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    POST /api/auth/login/
    Faz login do usuário (cria sessão)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            # Autenticar usuário
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)

                # Retornar dados do usuário
                return Response(
                    {
                        'message': 'Login realizado com sucesso',
                        'user': UsuarioSerializer(user, context={'request': request}).data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Credenciais inválidas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Faz logout do usuário (destrói sessão)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(
            {'message': 'Logout realizado com sucesso'},
            status=status.HTTP_200_OK
        )

class CurrentUserView(APIView):
    """
    GET /api/auth/user/
    Retorna dados do usuário autenticado
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """Atualiza dados do usuário com tratamento de booleano para FormData"""
        
        # Cria uma cópia mutável dos dados da requisição para manipulação segura
        data_copy = request.data.copy()

        if 'is_private' in data_copy:
            is_private_value = data_copy['is_private']
            
            # Se for uma string (que é o caso do FormData), converte explicitamente
            if isinstance(is_private_value, str):
                is_private_str = is_private_value.lower()
                
                if is_private_str == 'true':
                    data_copy['is_private'] = True
                elif is_private_str == 'false':
                    data_copy['is_private'] = False
                # Para qualquer outra string, o serializer fará a validação

        serializer = UsuarioUpdateSerializer(
            request.user,
            data=data_copy, # Passa a cópia com o booleano
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            # Retorna o usuário atualizado
            return Response(UsuarioSerializer(request.user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """
    GET /api/auth/csrf/
    Retorna o token CSRF para o frontend
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)})

class PublicProfileView(APIView):
    """
    GET /api/auth/profile/{username}/
    Retorna dados públicos de um usuário e seus momentos
    """
    permission_classes = [AllowAny]

    def get(self, request, username):
        # 1. Buscar o usuário
        user = get_object_or_404(Usuario, username=username)
        
        # 1.5. LÓGICA DE PRIVACIDADE: Bloquear acesso se privado e não for o dono
        is_owner = request.user.is_authenticated and request.user == user

        if user.is_private and not is_owner:
             return Response(
                {'error': 'Este perfil é privado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_serializer = UsuarioSerializer(user, context={'request': request})

        # 2. Buscar e paginar os momentos desse usuário
        pagination = MomentoPagination()
        
        if user.is_private and not is_owner:
            # Se o perfil é privado e não é o dono, não mostra nada
            momentos_queryset = Momento.objects.none()
        else:
            # Se o perfil é público OU é o próprio dono vendo
            momentos_queryset = Momento.objects.filter(usuario=user).order_by('-created_at')
            
            # Se não for o dono, filtrar apenas vídeos públicos
            if not is_owner:
                momentos_queryset = momentos_queryset.filter(is_private=False)

        # Paginar o queryset
        paginated_momentos = pagination.paginate_queryset(momentos_queryset, request)

        # Serializar os momentos paginados
        momentos_serializer = MomentoListSerializer(
            paginated_momentos,
            many=True,
            context={'request': request}
        )

        # 3. Combinar e retornar os dados
        data = {
            'user': user_serializer.data,
            # Retorna a resposta paginada completa (com count, next, previous, results)
            'momentos': pagination.get_paginated_response(momentos_serializer.data).data
        }

        return Response(data)

class UserSearchPagination(PageNumberPagination):
    page_size = 5  # Limita a 5 resultados
    page_size_query_param = 'page_size'
    max_page_size = 10

class UserSearchView(generics.ListAPIView):
    """
    GET /api/auth/search/?search=...
    Busca usuários por username
    """
    permission_classes = [AllowAny]
    serializer_class = UsuarioSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['username']  # Busca por username__icontains
    pagination_class = UserSearchPagination

    def get_queryset(self):
        return Usuario.objects.all().order_by('username')

    def get_serializer_context(self):
        # Fornece o 'request' ao serializer
        # Isso é essencial para o 'get_avatar' (gerar URL) funcionar.
        context = super(UserSearchView, self).get_serializer_context()
        context.update({'request': self.request})
        return context

class SendPasswordResetCodeView(APIView):
    """
    POST /api/auth/password-reset-code/
    Envia um código de recuperação de senha para o email do usuário
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Email não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        # Gerar código simples
        code = str(random.randint(100000, 999999))
        # Salvar código no usuário (campo temporário)
        user.password_reset_code = code
        # Registrar timestamp de envio e resetar contador de tentativas
        from django.utils import timezone
        user.password_reset_sent_at = timezone.now()
        user.password_reset_attempts = 0
        user.save()
        # Enviar email usando utilitário centralizado
        try:
            send_password_reset_email(email, code, username=getattr(user, 'username', None))
        except Exception as e:
            # Logando erro para debugar
            print('Erro ao enviar email de recuperação:', e)
            return Response({'error': 'Erro ao enviar código. Verifique o email informado.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Código enviado para o email.'}, status=status.HTTP_200_OK)

class VerifyPasswordResetCodeView(APIView):
    """
    POST /api/auth/password-reset-verify/
    Verifica se um código de recuperação corresponde ao email informado.
    Body esperado: { email, code }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({'error': 'Email e código são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Email não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if not getattr(user, 'password_reset_code', None):
            return Response({'error': 'Nenhum código registrado para este usuário.'}, status=status.HTTP_400_BAD_REQUEST)

        # Checar expiração: 10 minutos
        from django.utils import timezone
        sent_at = getattr(user, 'password_reset_sent_at', None)
        if not sent_at:
            return Response({'error': 'Timestamp do código ausente.'}, status=status.HTTP_400_BAD_REQUEST)

        elapsed = timezone.now() - sent_at
        if elapsed.total_seconds() > 10 * 60:
            # Código expirado: limpar campos
            user.password_reset_code = None
            user.password_reset_sent_at = None
            user.password_reset_attempts = 0
            user.save()
            return Response({'error': 'Código expirado. Solicite um novo código.'}, status=status.HTTP_400_BAD_REQUEST)

        # Checar número de tentativas
        if getattr(user, 'password_reset_attempts', 0) >= 5:
            return Response({'error': 'Número máximo de tentativas excedido. Solicite novo código.'}, status=status.HTTP_400_BAD_REQUEST)

        if str(user.password_reset_code) != str(code):
            # Incrementar tentativas
            user.password_reset_attempts = getattr(user, 'password_reset_attempts', 0) + 1
            user.save()
            remaining = max(0, 5 - user.password_reset_attempts)
            return Response({'error': f'Código inválido. Tentativas restantes: {remaining}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Sucesso: código válido -> resetar contador para segurança
        user.password_reset_attempts = 0
        user.save()
        return Response({'message': 'Código válido.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    POST /api/auth/password-reset/
    Redefine a senha do usuário usando email + code + new_password.
    Body esperado: { email, code, new_password }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({'error': 'Email, código e nova senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Email não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if str(user.password_reset_code) != str(code):
            return Response({'error': 'Código inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Efetuar reset de senha
        user.set_password(new_password)
        # Limpar o código e metadados
        user.password_reset_code = None
        user.password_reset_sent_at = None
        user.password_reset_attempts = 0
        user.save()

        return Response({'message': 'Senha redefinida com sucesso.'}, status=status.HTTP_200_OK)