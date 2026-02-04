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
activityreport_router = DefaultRouter()
activityreport_router.register(r'', views.ReportsViewSet, basename='activity_report')

# attendance router
attendance_router = DefaultRouter()
attendance_router.register(r'', views.AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('employees/', include(employees_router.urls)),
    path('departments/', include(dept_router.urls)),
    path('shifts/', include(shifts_router.urls)),
    path('reports/', include(activityreport_router.urls)),

    # ⚠️ IMPORTANT: Custom attendance endpoints MUST come BEFORE the router
    # These are function-based views with specific paths
    path('attendance/status/', views.attendance_status, name='attendance-status'),
    path('attendance/clock-in/', views.clock_in, name='clock-in'),
    path('attendance/clock-out/', views.clock_out, name='clock-out'),
    path('attendance/today/', views.today_summary, name='today-summary'),

    # Attendance router (ModelViewSet) - comes LAST
    # This handles: /attendance/, /attendance/{id}/, /attendance/history/, /attendance/team/
    path('attendance/', include(attendance_router.urls)),
]
