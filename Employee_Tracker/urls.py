from rest_framework.routers import DefaultRouter
from django.urls import path, include
from Employee_Tracker import views

# Router for department
dept_router = DefaultRouter()
dept_router.register(r'', views.DepartmentAPIViewSet, basename='department')

# Router for Employee and shifts
employees_router = DefaultRouter()
shifts_router = DefaultRouter()

employees_router.register(r'', views.EmployeeProfileViewSet, basename='employee')
shifts_router.register(r'', views.ShiftAPIViewSet, basename='shift')

# router for activity reports
activity_router = DefaultRouter()
activity_router.register(r'', views.ReportsViewSet, basename='activity_report')

# attendance router
attendance_router = DefaultRouter()
attendance_router.register(r'', views.AttendanceViewSet, basename='attendance')

# static shift template router
static_shift_router = DefaultRouter()
static_shift_router.register(r'', views.StaticShiftViewSet, basename='static_shift')

urlpatterns = [
    path('shifts_available', include(static_shift_router.urls)),
    path('employees/', include(employees_router.urls)),
    path('departments/', include(dept_router.urls)),
    path('shifts/', include(shifts_router.urls)),
    path('reports/', include(activity_router.urls)),
    path('attendance/', include(attendance_router.urls)),



]
