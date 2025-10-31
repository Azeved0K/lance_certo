from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import models

from .models import Momento, Tag, Like, Comentario
from .serializers import (
    MomentoListSerializer,
    MomentoDetailSerializer,
    MomentoCreateSerializer,
    MomentoUpdateSerializer,
    TagSerializer,
    ComentarioSerializer
)

class MomentoListCreateView(generics.ListCreateAPIView):
    """
    GET /api/momentos/ - Lista todos os momentos
    POST /api/momentos/ - Cria um novo momento
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descricao', 'tags__nome']
    ordering_fields = ['created_at', 'views', 'likes__id']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Momento.objects.select_related('usuario').prefetch_related('tags', 'likes')
        
        # Filtrar por tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        
        # Filtrar por usuário
        usuario = self.request.query_params.get('usuario', None)
        if usuario:
            queryset = queryset.filter(usuario__username=usuario)
        
        # Ordenação personalizada
        sort_by = self.request.query_params.get('sort', 'recent')
        if sort_by == 'popular':
            queryset = queryset.order_by('-views')
        elif sort_by == 'trending':
            queryset = queryset.annotate(
                total_likes=models.Count('likes')
            ).order_by('-total_likes')
        else:  # recent
            queryset = queryset.order_by('-created_at')
        
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
        
        # Incrementar views (apenas se não for o dono)
        if not request.user.is_authenticated or request.user != momento.usuario:
            momento.incrementar_views()
        
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