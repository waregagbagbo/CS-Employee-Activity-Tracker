from rest_framework.routers import DefaultRouter
from django.urls import path,include
from Employee_Tracker import views

router = DefaultRouter()
router.register(r'department', views.DepartmentAPIViewSet, basename='department')
router.register(r'webhook',views.WebHookViewSet, basename='webhook')

urlpatterns =[
    path('api',include(router.urls)),
    path('', views.EmployeeProfileAPIView.as_view(), name='profile'),

]