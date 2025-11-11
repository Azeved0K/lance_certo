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

        # --- CORREÇÃO ROBUSTA DE PERSISTÊNCIA DE BOOLEANOS ---
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
        # --- FIM CORREÇÃO DE PERSISTÊNCIA DE BOOLEANOS ---

        serializer = UsuarioUpdateSerializer(
            request.user,
            data=data_copy, # Passa a cópia com o booleano corrigido
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
    permission_classes = [AllowAny]  # Aberto para todos

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
        
        # Se for privado, e não for o dono, não carrega momentos
        if user.is_private and not is_owner:
            momentos_queryset = Momento.objects.none()
        else:
            momentos_queryset = Momento.objects.filter(usuario=user).order_by('-created_at')

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