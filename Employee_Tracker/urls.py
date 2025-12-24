from rest_framework.routers import DefaultRouter
from django.urls import path,include
from Employee_Tracker import views

# Router for department
dept_router = DefaultRouter()
dept_router.register(r'', views.DepartmentAPIViewSet, basename='department')

# Router for Employee and shifts
profile_router = DefaultRouter()
employees_router = DefaultRouter()

shifts_router = DefaultRouter()

profile_router.register(r'',views.ProfileViewSet, basename='profile')
employees_router.register(r'', views.EmployeeAPIViewSet, basename='employees')
shifts_router.register(r'',views.ShiftAPIViewSet, basename='shift')

# router for activity reports
activityreport_router = DefaultRouter()
activityreport_router.register(r'', views.ReportsViewSet, basename='activity_report')

urlpatterns =[
    path('profile/',include(profile_router.urls)),
    path('employees/', include(employees_router.urls)),
    path('departments/',include(dept_router.urls)),
    path('shifts/',include(shifts_router.urls)),
    path('reports/',include(activityreport_router.urls)),
]