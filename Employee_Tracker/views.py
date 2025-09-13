from datetime import datetime
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from accounts.models import Employee, Department
from accounts.permissions import IsEmployee, IsSupervisor, IsOwnerOrSupervisor, IsAdmin
from .models import Shift, WebHook, WebHookLog, ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,WebHookSerializer,WebHookLogSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication,filters
from rest_framework import generics
from rest_framework.decorators import permission_classes

User = get_user_model()

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
    search_fields = ['shift_agent','shift_type','shift_status']
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
        except ObjectDoesNotExist:
            return Shift.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        try:
            employee_profile = Employee.objects.get(user=user)
            timer = datetime.now().time()
            serializer.save(shift_agent=employee_profile, shift_start_time=timer)
        except ObjectDoesNotExist:
            raise ValidationError('Employee does not exist')

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
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type','activity_status']
    ordering_fields = ['activity_type','activity_status']
    pagination_class = PageNumberPagination

    #filter reports based on the users present
    def get_queryset(self):
            user = Employee.objects.get_object_or_404(user=self.request.user)
            if self.request.user.groups.filter(name__in=['Supervisor','Admin','Superuser']).exists():
                return ActivityReport.objects.filter(is_approved = False)
            else:
                return ActivityReport.objects.select_related('shift_active_agent').filter(shift_active_agent=user,is_approved = True)

    # set permissions
    def get_permissions(self):
        if self.action == 'list':
            permission_classes = [permissions.IsAuthenticated]

        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated,IsEmployee,IsAdmin]

        elif self.action == 'retrieve':
            permission_classes = [permissions.IsAuthenticated,IsEmployee,IsAdmin,IsOwnerOrSupervisor]

        elif self.action == 'update':
            permission_classes = [permissions.IsAuthenticated,IsSupervisor,IsAdmin]

        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated,IsAdmin]

        return [permissions() for permissions in permission_classes]







