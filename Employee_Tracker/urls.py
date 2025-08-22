from tkinter.font import names

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
TokenObtainPairView,TokenRefreshView,)
from django.urls import path,include
from Employee_Tracker import views


router = DefaultRouter()
router.register(r'department', views.DepartmentAPIViewSet, basename='department')
router.register(r'webhook',views.WebHookViewSet, basename='webhook')
router.register(r'weblogs',views.WebHookLogViewSet, basename='webhook_log')

urlpatterns =[
    path('api',include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),

    path('', views.EmployeeProfileAPIView.as_view(), name='profile'),
    path('profile_update',views.EmployeeProfileAPIUpdate.as_view(), name='profile_update'),
    path('shifts',views.ShiftAPIView.as_view(), name='shift'),
    path('shift/update',views.ShiftAPIUpdate.as_view(), name='shift_update'),

    # for tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


]