from django.urls import path, include
from rest_framework import views
from rest_framework.routers import DefaultRouter
from Employee_Tracker import views

router = DefaultRouter()
router.register(r'department', views.DepartmentAPIViewSet, basename='department'),
router.register(r'webhook',views.WebHookViewSet, basename='webhook'),
# set the views
urlpatterns =[
    path('',views.EmployeeProfileAPIView.as_view(),name='profile'),
    path('department',include('router.urls')), # for the viewset
    path('hooks', include('router.urls'))

]