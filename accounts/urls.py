from rest_framework_simplejwt.views import(TokenObtainPairView,TokenRefreshView,)
from django.urls import path
from accounts import views

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', views.UserRegistration.as_view(), name='user_registration'),
    path('profile/', views.UserProfileViews.as_view(), name='user-profile'),
    ]