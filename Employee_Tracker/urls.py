from rest_framework.routers import DefaultRouter
from django.urls import path,include
from Employee_Tracker import views

# Router for department
dept_router = DefaultRouter()
dept_router.register(r'', views.DepartmentAPIViewSet, basename='department')

# Router for webhook
hooks_router = DefaultRouter()
hooks_router.register(r'',views.WebHookViewSet, basename='webhook')
#hooks_router.register(r'weblogs',views.WebHookLogViewSet, basename='webhook_log')

urlpatterns =[
    path('department',include(dept_router.urls)),
    path('webhook/', include(hooks_router.urls)),
    path('api-auth/', include('rest_framework.urls')),

    path('', views.EmployeeProfileAPIView.as_view(), name='profile'),
    path('profile_update',views.EmployeeProfileAPIUpdate.as_view(), name='profile_update'),
    path('shifts',views.ShiftAPIView.as_view(), name='shift'),
    path('shift/update',views.ShiftAPIUpdate.as_view(), name='shift_update'),

    # for tokens


]