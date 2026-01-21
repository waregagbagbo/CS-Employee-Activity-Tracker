from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.management.commands.makemessages import STATUS_OK
from requests import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action,api_view,permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from accounts.models import Employee, Department
from accounts.permissions import UserTypeReportPermission, UserShiftPermission, CanEditOwnProfile, \
    DepartmentViewPermission
from .models import Shift, ActivityReport, Attendance
from .serializers import EmployeeProfileSerializer, ShiftSerializer, DepartmentSerializer, ActivityReportSerializer, \
    AttendanceSerializer
from rest_framework import viewsets, authentication, filters
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.response import Response



User = get_user_model() # reference the custom User model

# Views implemented using generics

#Department view
class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated,DepartmentViewPermission]

    def get_queryset(self):
       return Department.objects.all()


# Employee Profile view
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = (IsAuthenticated,CanEditOwnProfile)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)

    def get_queryset(self):
        user = self.request.user
        current_employee = self.request.user.employee_profile

        if user.is_superuser or user.is_staff:
            return Employee.objects.all()
        return Employee.objects.filter(user=self.request.user) # filter by user's own department

    # for self profile
    @action(detail=False,methods=['PUT','GET','PATCH'], url_path='me')
    def me(self, request):
        """
           Endpoint: /api/employees/me/
           Handles fetching and updating the logged-in user's own profile.
        """
        try:
            profile = request.user.employee_profile
        except AttributeError as e:
            return Response({"error": "User has no employee profile"},e)

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)  # This will work now!

        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


#Shift view
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated,UserShiftPermission]
    pagination_class = PageNumberPagination

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
        if employee_profile.user_type == 'sdmin':
            return parent_queryset.all()

        elif employee_profile.user_type == 'supervisor':
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

    @action(detail=True, methods=['patch'], url_path='start')
    def start_shift(self, request, pk=None):
        """Start a shift - sets shift_start_time to now and status to In Progress"""
        shift = self.get_object()

        # Check permissions - only the shift owner can start
        if shift.shift_agent != request.user.employee_profile:
            return Response({'error':'You can only start your own shifts'}, status=403)

        if shift.shift_status == 'In Progress':
            return Response({'error': 'Shift is already in progress'}, status=400)

        if shift.shift_status == 'Completed':
            return Response({'error': 'Cannot start a completed shift'}, status=400)

        # Set current time as start time
        shift.shift_start_time = timezone.now().time()
        shift.shift_status = 'In Progress'
        shift.save()

        serializer = self.get_serializer(shift)
        return Response({'message': 'Shift started successfully','shift': serializer.data})

    @action(detail=True, methods=['patch'], url_path='end')
    def end_shift(self, request, pk=None):
        """End a shift - validates 8-hour minimum before completion"""
        shift = self.get_object()

        # Check permissions
        if shift.shift_agent != request.user.employee_profile:
            return Response({
                'error': 'You can only end your own shifts'}, status=403)

        if shift.shift_status != 'In Progress':
            return Response({'error': 'Shift must be in progress to end it'}, status=400)

        if shift.shift_status == 'Completed':
            return Response({'error': 'Shift is already completed'}, status=400)

        # Calculate duration
        if not shift.shift_start_time:
            return Response({'error': 'Shift has no start time'
            }, status=400)

        # Get current time and calculate duration
        now = timezone.now()
        today = timezone.localdate()
        start_dt = timezone.make_aware(datetime.combine(today, shift.shift_start_time))

        # Handle overnight shift in progress
        if now < start_dt:
            start_dt -= timedelta(days=1)

        duration_hours = (now - start_dt).total_seconds() / 3600

        # Enforce 8-hour minimum
        if duration_hours < 8:
            hours_remaining = 8 - duration_hours
            return Response({
                'error': f'Minimum 8 hours required to complete shift. {round(hours_remaining, 2)} hours remaining.',
                'current_duration': round(duration_hours, 2),
                'required_duration': 8
            }, status=400)

        # All validations passed - end the shift
        shift.shift_end_time = now.time()
        shift.shift_status = 'Completed'
        shift.save()

        serializer = self.get_serializer(shift)
        return Response({
            'message': f'Shift completed! You worked {round(duration_hours, 2)} hours.',
            'shift': serializer.data,
            'total_hours': round(duration_hours, 2)
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




""" 
display the attendance sheet
"""
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    permission_classes = [IsAuthenticated,UserTypeReportPermission]
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            employee_profile = Employee.objects.select_related('user').get(user=user)
        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')
            return Attendance.objects.none()

        return Attendance.objects.all()
        print(Attendance.objects.all())


# Check if user is clocked in
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_status(request):
    try:
        employee = request.user.employee_profile

        # Check for active clock-in (no clock-out yet)
        active = Attendance.objects.filter(
            employee=employee,
            clock_out_time__isnull=True
        ).first()

        if active:
            return Response({
                'is_clocked_in': True,
                'clock_in_time': active.clock_in_time
            })
        else:
            return Response({'is_clocked_in': False})
    except:
        return Response({'is_clocked_in': False})


# Clock In
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_in(request):
    try:
        employee = request.user.employee_profile

        # Check if already clocked in
        active = Attendance.objects.filter(
            employee=employee,
            clock_out_time__isnull=True
        ).first()

        if active:
            return Response(
                {'detail': 'Already clocked in'},
                status=400
            )

        # Create new attendance record
        attendance = Attendance.objects.create(
            employee=employee,
            clock_in_time=timezone.now()
        )

        return Response({
            'message': 'Clocked in successfully',
            'clock_in_time': attendance.clock_in_time
        })
    except Exception as e:
        return Response({'detail': str(e)}, status=400)


# Clock Out
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_out(request):
    try:
        employee = request.user.employee_profile

        # Find active clock-in
        active = Attendance.objects.filter(
            employee=employee,
            clock_out_time__isnull=True
        ).first()

        if not active:
            return Response(
                {'detail': 'Not clocked in'},
                status=400
            )

        # Update with clock-out time
        active.clock_out_time = timezone.now()

        # Calculate duration in hours
        duration = (active.clock_out_time - active.clock_in_time).total_seconds() / 3600
        active.duration_hours = round(duration, 2)
        active.save()

        return Response({
            'message': 'Clocked out successfully',
            'duration_hours': active.duration_hours,
            'clock_in_time': active.clock_in_time,
            'clock_out_time': active.clock_out_time
        })
    except Exception as e:
        return Response({'detail': str(e)}, status=400)
