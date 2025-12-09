from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from accounts.models import Employee, Department
from accounts.permissions import UserTypeReportPermission,UserShiftPermission
from .models import Shift,ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,ActivityReportSerializer
from rest_framework import viewsets, authentication, filters


User = get_user_model() # reference the custom User model

# Views implemented using generics

#Department view
class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Department.objects.all()


#Profile view
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAuthenticated,)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)
    lookup_field = 'pk'

    def get_queryset(self):
        # get the instance object of the current user
        employee_profile = Employee.objects.filter(user=self.request.user)
        try:
            if self.request.user.is_superuser or self.request.user.is_staff:
                return Employee.objects.all()
        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')
        return employee_profile

    # enable partial update
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().partial_update(request, *args, **kwargs)


#Shift view
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated,UserShiftPermission]
    pagination_class = PageNumberPagination
    lookup_field = 'pk'

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
        """Auto-assign shift_agent to current user's employee profile"""
        user = self.request.user
        try:
            employee = user.employee_profile
            # Only Employee_Agent can create their own shifts
            if employee.user_type != 'Employee_Agent':
                raise ValidationError({
                    'error': 'Only Employee Agents can create shifts'
                })
            # Save with shift_agent set to current employee
            serializer.save(shift_agent=employee)
        except (ObjectDoesNotExist, AttributeError):
            raise ValidationError({
                'error': 'Employee profile not found. Please contact admin.'
            })



#Activity report view
class ReportsViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsAuthenticated,UserTypeReportPermission]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type','activity_status']
    ordering_fields = ['activity_type','activity_status']
    pagination_class = PageNumberPagination
    lookup_field = 'pk'

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

        # set base queryset for optimization from an agent
        reports_base_queryset = ActivityReport.objects.select_related('shift_active_agent')

        # now fetch access for the actual user types
        if employee_profile.user_type == 'Admin':
            return reports_base_queryset.all()

        elif employee_profile.user_type == 'Supervisor':
            return reports_base_queryset.filter(shift_active_agent__supervisor=employee_profile)

        else:
            return reports_base_queryset.filter(shift_active_agent=employee_profile)

    # perform create method by user type
