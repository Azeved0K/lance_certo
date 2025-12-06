from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    CSRFTokenView,
    PublicProfileView,
    UserSearchView,
    SendPasswordResetCodeView,
    VerifyPasswordResetCodeView,
    ResetPasswordView,
)

app_name = 'usuarios'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('password-reset-code/', SendPasswordResetCodeView.as_view(), name='password-reset-code'),
    path('password-reset-verify/', VerifyPasswordResetCodeView.as_view(), name='password-reset-verify'),
    path('password-reset/', ResetPasswordView.as_view(), name='password-reset'),
]