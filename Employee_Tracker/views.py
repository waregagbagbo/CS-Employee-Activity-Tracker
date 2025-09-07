from django_filters.rest_framework import DjangoFilterBackend
from pip._vendor.requests.models import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import get_object_or_404
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


User = apps.get_model(settings.AUTH_USER_MODEL)

# Views implemented using generics
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAuthenticated,)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)

    # add detail method
    """def detail(self, request, pk=None):
        query = EmployeeProfile.objects.all()
        user = get_object_or_404(query,pk=pk)
        serializer = EmployeeProfileSerializer(user)
        return Response(serializer.data)"""
    def get_queryset(self):
        employee_profile = Employee.objects.filter(user=self.request.user)
        return employee_profile


""" shift view """
class ShiftAPIViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filter_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # to get the employee profile instance
        try:
            employee_profile = Employee.objects.get(user=self.request.user) #get the profile
            queryset = Shift.objects.filter(shift_agent = employee_profile)
        except Employee.DoesNotExist:
            queryset = Shift.objects.all() # returns empty queryset if no profile exists
        return queryset


"""" Department view """
class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]

""" WebHook view """
class WebHookViewSet(viewsets.ModelViewSet):
    queryset = WebHook.objects.all()
    serializer_class = WebHookSerializer

class WebHookLogViewSet(viewsets.ModelViewSet):
    queryset = WebHookLog.objects.all()
    serializer_class = WebHookLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]

""" Activity report view """
class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    serializer_class = ActivityReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['shift_active_agent', 'supervisor','report_type','is_approved']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsEmployee | IsSupervisor,IsAuthenticated]  # Either employee or supervisor

    def get_permissions(self):
        if self.action in ['create', 'update']:
            return [IsEmployee()]
        elif self.action in ['approve']:
            return [IsSupervisor()]
        elif self.action in ['retrieve', 'list']:
            return [IsOwnerOrSupervisor()]
        return super().get_permissions()

    # run the queryset to get reports
    def get_reports(self,request):
        if request.user.user_type == 'Supervisor' or request.user.user_type == 'Admin':
            # fetch employees handled by the supervisor
            supervised_team = request.user.supervised_employee.all()
            # fetch the report
            reports_query = ActivityReport.objects.filter(employee__in=supervised_team) | ActivityReport.objects.filter(is_approved=True)
            return reports_query
    




