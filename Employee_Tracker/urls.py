from tkinter.font import names

from rest_framework.routers import DefaultRouter
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
]