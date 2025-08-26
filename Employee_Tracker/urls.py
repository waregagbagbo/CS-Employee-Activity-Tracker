from rest_framework.routers import DefaultRouter
from django.urls import path,include
from Employee_Tracker import views

# Router for department
dept_router = DefaultRouter()
dept_router.register(r'', views.DepartmentAPIViewSet, basename='department')

# Router for webhook
hooks_router = DefaultRouter()
hooks_router.register(r'',views.WebHookViewSet, basename='webhook')

# Router for Employee and shifts
employee_router = DefaultRouter()
shifts_router = DefaultRouter()
employee_router.register(r'',views.EmployeeProfileViewSet, basename='employee_profile')
shifts_router.register(r'',views.ShiftAPIViewSet, basename='shift')
urlpatterns =[
    path('department',include(dept_router.urls)),
    path('webhook/', include(hooks_router.urls)),
    path('employee',include(employee_router.urls)),
    path('',include(shifts_router.urls)),

    path('api-auth/', include('rest_framework.urls')),
]