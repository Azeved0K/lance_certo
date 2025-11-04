from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import models
import logging

from .models import Momento, Tag, Like, Comentario
from .serializers import (
    MomentoListSerializer,
    MomentoDetailSerializer,
    MomentoCreateSerializer,
    MomentoUpdateSerializer,
    TagSerializer,
    ComentarioSerializer
)

# ✅ Logger para debug
logger = logging.getLogger(__name__)

class MomentoListCreateView(generics.ListCreateAPIView):
    """
    GET /api/momentos/ - Lista todos os momentos
    POST /api/momentos/ - Cria um novo momento
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descricao', 'tags__nome']
    ordering_fields = ['created_at', 'views']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # ✅ Busca base com prefetch para otimização
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
        
        # ✅ ORDENAÇÃO CORRIGIDA
        sort_by = self.request.query_params.get('sort', 'recent')
        logger.info(f"📊 Ordenação solicitada: {sort_by}")
        
        if sort_by == 'popular':
            # Ordenar por visualizações (mais vistas primeiro)
            queryset = queryset.order_by('-views', '-created_at')
            logger.info(f"📊 Ordenando por views (popular)")
            
        elif sort_by == 'trending':
            # Ordenar por curtidas (em alta)
            # ✅ CRÍTICO: Anotar com alias diferente da property do modelo
            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True)
            ).order_by('-likes_count', '-views', '-created_at')
            logger.info(f"📊 Ordenando por curtidas (trending)")
            
        else:  # recent (padrão)
            # Ordenar por data de criação (mais recentes primeiro)
            queryset = queryset.order_by('-created_at')
            logger.info(f"📊 Ordenando por data (recent)")
        
        # ✅ Log de debug: mostrar primeiros 5 resultados
        momentos_list = list(queryset[:5])
        for m in momentos_list:
            likes = getattr(m, 'likes_count', m.likes.count()) if sort_by == 'trending' else m.likes.count()
            logger.info(f"  - {m.titulo}: {m.views} views, {likes} likes, {m.created_at}")
        
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
        
        # Incrementar view
        momento.incrementar_views()
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
        
        # Verifica se já curtiu
        like, created = Like.objects.get_or_create(
            usuario=request.user,
            momento=momento
        )
        
        if created:
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