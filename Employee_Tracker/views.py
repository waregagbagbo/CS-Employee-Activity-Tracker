from datetime import datetime
from http.client import HTTPResponse
from urllib import response

from django.contrib.auth import get_user_model
from django.contrib.sessions.serializers import JSONSerializer
from django.core.exceptions import ObjectDoesNotExist, ValidationError, PermissionDenied
from django.db.migrations import serializer
from requests import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.status import HTTP_201_CREATED
from accounts.models import Employee, Department
from accounts.permissions import IsAdmin, IsEmployee, ActivityReportsPermissions
from .models import Shift,ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication, filters, status
from rest_framework import permissions


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

#Activity report view
class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type','activity_status']
    ordering_fields = ['activity_type','activity_status']
    #Pagination_class = PageNumberPagination

    #filter reports based on the users present
    def get_queryset(self):
        """Return activity reports based on user_type
        Admin - View all,
        Supervisor - View activity reports for their agents,
        Agents - View only their activity reports.
        """
        # create a user object
        user = self.request.user
        if not user.is_authenticated:
            return ActivityReport.objects.none()
        try:
            employee_profile = Employee.objects.select_related('user').get(user=self.request.user)

        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')
            return ActivityReport.objects.none()

        # set base queryset for optimization
        reports_base_queryset = ActivityReport.objects.select_related('shift_active_agent')

        # now fetch access for the actual user types
        if employee_profile.user_type == 'Admin':
            return reports_base_queryset.all()

        elif employee_profile.user_type == 'Supervisor':
            return reports_base_queryset.filter(shift_active_agent__supervisor=employee_profile)

        else:
            return reports_base_queryset.filter(shift_active_agent=employee_profile)


    # create a serializer to control the field displays
    def create(self, request, *args, **kwargs):
        user_profile = Employee.objects.select_related('user').get(user=request.user)
        if user_profile.user_type == 'Supervisor':
            raise PermissionDenied("Supervisors are not allowed to create reports.")
        return super().create(request, *args, **kwargs)


