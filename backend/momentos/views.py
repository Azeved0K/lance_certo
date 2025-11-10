from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from .models import Momento, Tag, Like, Comentario, Notificacao
from .serializers import (
    MomentoListSerializer,
    MomentoDetailSerializer,
    MomentoCreateSerializer,
    MomentoUpdateSerializer,
    TagSerializer,
    ComentarioSerializer,
    NotificacaoSerializer
)
import logging

# Logger para debug
logger = logging.getLogger(__name__)

# Classe de Paginação Customizada
class MomentoPagination(PageNumberPagination):
    page_size = 9  # 9 momentos por página (3x3 grid)
    page_size_query_param = 'page_size'  # Permite customizar: ?page_size=12
    max_page_size = 24  # Máximo de 24 por página

class MomentoListCreateView(generics.ListCreateAPIView):
    """
    GET /api/momentos/ - Lista todos os momentos (com paginação)
    POST /api/momentos/ - Cria um novo momento
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descricao', 'tags__nome']
    ordering_fields = ['created_at', 'views']
    pagination_class = MomentoPagination  # Ativa paginação
    
    def get_queryset(self):
        # Busca base com prefetch para otimização
        queryset = Momento.objects.select_related('usuario').prefetch_related('tags')
        
        # Filtrar por tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__slug=tag)
            logger.info(f"🏷️ Filtrando por tag: {tag}")
        
        # Filtrar por usuário
        usuario = self.request.query_params.get('usuario', None)
        if usuario:
            queryset = queryset.filter(usuario__username=usuario)
            logger.info(f"👤 Filtrando por usuário: {usuario}")
        
        # Busca por texto
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(descricao__icontains=search) |
                Q(tags__nome__icontains=search)
            ).distinct()
            logger.info(f"🔍 Busca por texto: {search}")
        
        sort_by = self.request.query_params.get('sort', 'recent')
        logger.info(f"📊 Ordenação solicitada: {sort_by}")
        
        if sort_by == 'trending':
            # EM ALTA = Ordenar por visualizações
            queryset = queryset.order_by('-views', '-created_at')
            logger.info(f"🔥 Ordenando por views (trending/em alta)")
            
        elif sort_by == 'popular':
            # POPULARES = Ordenar por curtidas (mais curtidas primeiro)
            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True)
            ).order_by('-likes_count', '-views', '-created_at')
            logger.info(f"❤️ Ordenando por curtidas (popular)")
            
        else:  # recent (padrão)
            # Ordenar por data de criação (mais recentes primeiro)
            queryset = queryset.order_by('-created_at')
            logger.info(f"📅 Ordenando por data (recent)")
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MomentoCreateSerializer
        return MomentoListSerializer
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class MomentoDetailView(APIView):
    """
    GET /api/momentos/{id}/ - Detalhes de um momento
    PATCH /api/momentos/{id}/ - Atualiza um momento
    DELETE /api/momentos/{id}/ - Deleta um momento
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_object(self, pk):
        return get_object_or_404(
            Momento.objects.select_related('usuario').prefetch_related('tags', 'comentarios'),
            pk=pk
        )
    
    def get(self, request, pk):
        momento = self.get_object(pk)
        serializer = MomentoDetailSerializer(momento, context={'request': request})
        return Response(serializer.data)
    
    def patch(self, request, pk):
        momento = self.get_object(pk)
        
        # Apenas o dono pode editar
        if request.user != momento.usuario:
            return Response(
                {'error': 'Você não tem permissão para editar este momento'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MomentoUpdateSerializer(momento, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(MomentoDetailSerializer(momento, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        momento = self.get_object(pk)
        
        # Apenas o dono pode deletar
        if request.user != momento.usuario:
            return Response(
                {'error': 'Você não tem permissão para deletar este momento'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        momento.delete()
        return Response(
            {'message': 'Momento deletado com sucesso'},
            status=status.HTTP_204_NO_CONTENT
        )


class MomentoIncrementViewView(APIView):
    """
    POST /api/momentos/{id}/view/ - Incrementa view do momento
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request, pk):
        momento = get_object_or_404(Momento, pk=pk)

        # Não incrementar se for o dono
        if request.user.is_authenticated and request.user == momento.usuario:
            return Response(
                {'message': 'Donos não incrementam views próprias', 'views': momento.views},
                status=status.HTTP_200_OK
            )

        # Lógica de notificação de views
        views_antes = momento.views
        momento.incrementar_views()
        views_depois = momento.views

        # Criar notificação ao atingir 15 views
        if views_depois == 15 and views_antes < 15:
            try:
                Notificacao.objects.create(
                    usuario_destino=momento.usuario,
                    momento=momento,
                    tipo='view_milestone',
                    mensagem=f'Seu momento "{momento.titulo}" atingiu 15 visualizações! 🚀'
                )
                logger.info(f"🎉 Notificação de 15 views criada para '{momento.titulo}'")
            except Exception as e:
                logger.error(f"Erro ao criar notificação de views: {e}")

        logger.info(f"👁️ View incrementada para '{momento.titulo}': {momento.views} views")

        return Response(
            {'message': 'View incrementada', 'views': momento.views},
            status=status.HTTP_200_OK
        )

class MomentoLikeView(APIView):
    """
    POST /api/momentos/{id}/like/ - Curtir momento
    DELETE /api/momentos/{id}/like/ - Descurtir momento
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        momento = get_object_or_404(Momento, pk=pk)

        like, created = Like.objects.get_or_create(
            usuario=request.user,
            momento=momento
        )

        if created:
            # Criar notificação de like (se não for o próprio dono)
            if momento.usuario != request.user:
                try:
                    Notificacao.objects.create(
                        usuario_destino=momento.usuario,
                        usuario_origem=request.user,
                        momento=momento,
                        tipo='like',
                        mensagem=f'{request.user.username} curtiu seu momento: "{momento.titulo}"'
                    )
                    logger.info(f"🎉 Notificação de like criada para '{momento.titulo}'")
                except Exception as e:
                    logger.error(f"Erro ao criar notificação de like: {e}")

            logger.info(f"❤️ {request.user.username} curtiu '{momento.titulo}': {momento.total_likes} likes")
            return Response(
                {
                    'message': 'Momento curtido',
                    'total_likes': momento.total_likes
                },
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'message': 'Você já curtiu este momento'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def delete(self, request, pk):
        momento = get_object_or_404(Momento, pk=pk)
        
        try:
            like = Like.objects.get(usuario=request.user, momento=momento)
            like.delete()
            logger.info(f"💔 {request.user.username} descurtiu '{momento.titulo}': {momento.total_likes} likes")
            return Response(
                {
                    'message': 'Like removido',
                    'total_likes': momento.total_likes
                },
                status=status.HTTP_200_OK
            )
        except Like.DoesNotExist:
            return Response(
                {'error': 'Você não curtiu este momento'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ComentarioListCreateView(APIView):
    """
    GET /api/momentos/{id}/comentarios/ - Lista comentários
    POST /api/momentos/{id}/comentarios/ - Cria comentário
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request, pk):
        momento = get_object_or_404(Momento, pk=pk)
        comentarios = momento.comentarios.select_related('usuario').order_by('created_at')
        serializer = ComentarioSerializer(comentarios, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        momento = get_object_or_404(Momento, pk=pk)
        serializer = ComentarioSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(usuario=request.user, momento=momento)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ComentarioDeleteView(APIView):
    """
    DELETE /api/comentarios/{id}/ - Deleta comentário
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        comentario = get_object_or_404(Comentario, pk=pk)
        
        # Apenas o dono ou dono do momento pode deletar
        if request.user != comentario.usuario and request.user != comentario.momento.usuario:
            return Response(
                {'error': 'Você não tem permissão para deletar este comentário'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comentario.delete()
        return Response(
            {'message': 'Comentário deletado'},
            status=status.HTTP_204_NO_CONTENT
        )

class TagListView(generics.ListAPIView):
    """
    GET /api/tags/ - Lista todas as tags
    """
    queryset = Tag.objects.all().order_by('nome')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class NotificacaoListView(generics.ListAPIView):
    """
    GET /api/momentos/notificacoes/ - Lista notificações do usuário logado
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificacaoSerializer

    def get_queryset(self):
        # Retorna apenas as 30 mais recentes
        return Notificacao.objects.filter(
            usuario_destino=self.request.user
        ).order_by('-created_at')[:30]


class NotificacaoMarcarLidasView(APIView):
    """
    POST /api/momentos/notificacoes/marcar-lidas/ - Marca todas como lidas
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notificacao.objects.filter(
            usuario_destino=request.user,
            lida=False
        ).update(lida=True)
        return Response(
            {'message': 'Notificações marcadas como lidas'},
            status=status.HTTP_200_OK
        )