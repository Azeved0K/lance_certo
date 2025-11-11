from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    CSRFTokenView,
    PublicProfileView
)

app_name = 'usuarios'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
]