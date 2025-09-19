from datetime import datetime
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from accounts.models import Employee, Department
from accounts.permissions import IsInAllowedGroup
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
""""class WebHookViewSet(viewsets.ModelViewSet):
    queryset = WebHook.objects.all()
    serializer_class = WebHookSerializer

    def get_queryset(self):
        return WebHook.objects.all()


class WebHookLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebHookLog.objects.all()
    serializer_class = WebHookLogSerializer
    permission_classes = [AllowAny]
    #authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]"""

#Activity report view
class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsInAllowedGroup]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type','activity_status']
    ordering_fields = ['activity_type','activity_status']
    pagination_class = PageNumberPagination

    #filter reports based on the users present
    def get_queryset(self):
        try:
            user = Employee.objects.get(user=self.request.user)
        except ObjectDoesNotExist:
            return ActivityReport.objects.none()

        if self.request.user.groups.filter(name__in=['Supervisor','Admin']).exists():
            return ActivityReport.objects.filter(is_approved = False)
        else:
            return ActivityReport.objects.select_related('shift_active_agent').filter(shift_active_agent=user,is_approved = True)

    # get perms
    def get_permissions(self):
        if self.action == 'list':
            return  [permission() for permission in permission_classes]


