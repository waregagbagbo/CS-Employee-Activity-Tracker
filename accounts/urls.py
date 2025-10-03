from rest_framework_simplejwt.views import(TokenObtainPairView,TokenRefreshView,)
from django.urls import path
from accounts import views
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.UserRegistration.as_view(), name='user_registration'),
    path('api/profile/', views.UserProfileViews.as_view(), name='profile'),
    #path('api/login',views.UserLogin.as_view(),name='login'),
    #path('api/logout/',views.LogoutView.as_view(),name='logout'),
    # for auth token
    path('api-token-auth/', obtain_auth_token),
]