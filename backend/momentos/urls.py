from django.urls import path
from .views import (
    MomentoListCreateView,
    MomentoDetailView,
    MomentoIncrementViewView,
    MomentoLikeView,
    ComentarioListCreateView,
    ComentarioDeleteView,
    TagListView
)

app_name = 'momentos'

urlpatterns = [
    # Momentos
    path('', MomentoListCreateView.as_view(), name='momento-list-create'),
    path('<int:pk>/', MomentoDetailView.as_view(), name='momento-detail'),
    path('<int:pk>/view/', MomentoIncrementViewView.as_view(), name='momento-increment-view'),
    path('<int:pk>/like/', MomentoLikeView.as_view(), name='momento-like'),
    
    # Comentários
    path('<int:pk>/comentarios/', ComentarioListCreateView.as_view(), name='comentario-list-create'),
    path('comentarios/<int:pk>/', ComentarioDeleteView.as_view(), name='comentario-delete'),
    
    # Tags
    path('tags/', TagListView.as_view(), name='tag-list'),
]