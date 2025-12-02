from rest_framework_simplejwt.views import(TokenObtainPairView,TokenRefreshView,TokenVerifyView)
from django.urls import path
from accounts import views
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


urlpatterns = [
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    path('auth/register/', views.UserRegistration.as_view(), name='user_registration'),

    path('',views.UserLogin.as_view(),name='login'),
    path('auth/logout/',views.LogoutView.as_view(),name='logout'),
    # for auth token
    path('api-token-auth/', obtain_auth_token),

    # swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]