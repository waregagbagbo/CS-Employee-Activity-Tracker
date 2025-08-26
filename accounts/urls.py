from rest_framework_simplejwt.views import (
TokenObtainPairView,TokenRefreshView,)
from django.urls import path
from .import views

url_patterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', views.UserRegistration.as_view(), name='user'),

]