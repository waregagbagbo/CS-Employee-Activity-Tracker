from datetime import datetime
from http.client import HTTPResponse
from urllib import response

from django.contrib.auth import get_user_model
from django.contrib.sessions.serializers import JSONSerializer
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.migrations import serializer
from requests import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.status import HTTP_201_CREATED
from accounts.models import Employee, Department
from accounts.permissions import IsAdmin,IsEmployee
from .models import Shift,ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication, filters, status
from rest_framework import generics
from rest_framework.decorators import permission_classes



User = get_user_model() # reference the custom User model

# Views implemented using generics
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAuthenticated,)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)

    def get_queryset(self):
        # get the instance object of the current user
        employee_profile = Employee.objects.filter(user=self.request.user)
        try:
            if self.request.user.is_superuser or self.request.user.is_staff:
                return Employee.objects.all()
        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')
        return employee_profile

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


#Shift view
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]
    PaginationClass = PageNumberPagination

    def get_queryset(self):
        """Return shifts based on user_type
          Admin - View all,
          Supervisor - View shifts for their agents,
          Agents - View only their shifts.
        """
        # create user object / instance
        user = self.request.user
        if not user.is_authenticated:
            return Shift.objects.none() # no shifts for unathenticated users

        try:
            employee_profile = Employee.objects.select_related('user').get(user=self.request.user)
        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')
            return Shift.objects.none()

        # set a parent queryset to achieve optimization
        parent_queryset = Shift.objects.select_related('shift_agent')

        # filter base on user type
        if employee_profile.user_type == 'Admin':
            return parent_queryset.all()

        elif employee_profile.user_type == 'Supervisor':
            return parent_queryset.filter(shift_agent__supervisor=employee_profile)

        else:
            return parent_queryset.filter(shift_agent=employee_profile)


    def perform_create(self, serializer):
        # create shift for authenticated users
        user = self.request.user
        try:
            employee_profile = Employee.objects.get(user=user)
            timer = datetime.now().time()
            serializer.save(shift_agent=employee_profile, shift_start_time=timer)
            print('Shift updated successfully')
        except ObjectDoesNotExist:
            raise ValidationError('Employee does not exist')

        # prevent supervisors from creating their own shifts
        if employee_profile.user_type == 'Supervisor':
            raise ValidationError({
                'detail': 'Supervisors cannot create shifts for themselves.'
            })
        current_time = datetime.now().time()
        serializer.save(shift_agent=employee_profile,shift_start_time=current_time)


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
    permission_classes = []
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


