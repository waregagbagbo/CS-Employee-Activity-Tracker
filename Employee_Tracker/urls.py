from rest_framework.routers import DefaultRouter
from django.urls import path,include
from Employee_Tracker import views

# Router for department
dept_router = DefaultRouter()
dept_router.register(r'', views.DepartmentAPIViewSet, basename='department')

# Router for Employee and shifts
employee_router = DefaultRouter()

shifts_router = DefaultRouter()

employee_router.register(r'',views.EmployeeProfileViewSet, basename='employee')
shifts_router.register(r'',views.ShiftAPIViewSet, basename='shift')

# router for activity reports
activityreport_router = DefaultRouter()
activityreport_router.register(r'', views.ReportsViewSet, basename='activity_report')

urlpatterns =[
    path('employee/', include(employee_router.urls)),
    path('department/',include(dept_router.urls)),
    path('shifts/',include(shifts_router.urls)),
    path('reports/',include(activityreport_router.urls)),
]