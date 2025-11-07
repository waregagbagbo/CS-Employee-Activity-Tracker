from django.urls import path

from . import views

app_name = 'dashboard'

urlpatterns = [
    # Dashboard Home
    path('home/', views.home, name='home'),

    # Authentication
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Employees
    path('employees/', views.employee_list, name='employee_list'),
    path('employees/<int:pk>/', views.employee_detail, name='employee_detail'),

    # Shifts
    path('shifts/', views.shift_list, name='shift_list'),
    path('shifts/<int:pk>/', views.shift_detail, name='shift_detail'),

    # Reports
    path('reports/', views.report_list, name='report_list'),
    path('reports/<int:pk>/', views.report_detail, name='report_detail'),
    path('reports/<int:pk>/approve/', views.report_approve, name='report_approve'),
]