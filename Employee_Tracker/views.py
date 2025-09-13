from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from Cs_Tracker import settings
from accounts.models import Employee, Department
from accounts.permissions import IsEmployee, IsSupervisor, IsOwnerOrSupervisor
from .models import Shift, WebHook, WebHookLog, ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,WebHookSerializer,WebHookLogSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication,filters
from rest_framework import generics
from django.apps import apps
from rest_framework.decorators import permission_classes


User = apps.get_model(settings.AUTH_USER_MODEL)

# Views implemented using generics
class EmployeeProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAuthenticated,)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)

    def get_queryset(self):
        employee_profile = Employee.objects.get(user=self.request.user)
        if self.request.user.is_superuser:
            employee_profile = Employee.objects.all()
        return employee_profile


#Shift view
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filter_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]
    PaginationClass = PageNumberPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Shift.objects.none()
        try:
            employee_profile = Employee.objects.get(user=user)
            return Shift.objects.filter(shift_agent=employee_profile)
        except Employee.DoesNotExist:
            return Shift.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        try:
            employee_profile = Employee.objects.get(user=user)
            timer = datetime.now().time()
            serializer.save(shift_agent=employee_profile, shift_start_time=timer)
        except ObjectDoesNotExist:
            raise 'Employee does not exist'


#Department view
class DepartmentAPIViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]

#WebHook view
class WebHookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebHook.objects.all()
    serializer_class = WebHookSerializer

class WebHookLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebHookLog.objects.all()
    serializer_class = WebHookLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]

#Activity report view
class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    serializer_class = ActivityReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filter_fields = ['activity_type','activity_status']

    #filter reports based on the users present
    def get_queryset(self):
        user = Employee.objects.get(user=self.request.user)
        if self.request.user.groups.filter(name__in=['supervisor','admin','superuser']).exists():
            return ActivityReport.objects.filter(is_approved = False)
        else:
            return ActivityReport.objects.filter(shift_active_agent = user)




