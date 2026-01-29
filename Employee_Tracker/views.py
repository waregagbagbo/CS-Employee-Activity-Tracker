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
from .serializers import EmployeeProfileSerializer, ShiftSerializer, DepartmentSerializer, ActivityReportSerializer,\
     AttendanceStatsSerializer,AttendanceUpdateSerializer,AttendanceSupervisorSerializer,\
    AttendanceListSerializer
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

    def get_queryset_getattr(self):
        user = self.request.user

        if user.is_superuser or user.is_staff:
            return Employee.objects.all()

        profile = getattr(user, 'employee_profile', None)

        if profile and profile.department:
            return Employee.objects.filter(department=profile.department)

        return Employee.objects.none()


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

    @action(detail=False, methods=['patch'], url_path='start')
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

    @action(detail=False, methods=['patch'], url_path='end')
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


""" Display the attendance sheet """

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    permission_classes = [IsAuthenticated, UserTypeReportPermission]
    serializer_class = AttendanceListSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            employee_profile = Employee.objects.select_related('user').get(user=user)

            #  Return only this employee's attendance records
            return Attendance.objects.filter(employee=employee_profile).select_related('shift', 'employee')

        except Employee.DoesNotExist as e:
            print(f'User with that profile does not exist: {e}')
            return Attendance.objects.none()


# Check if user is clocked in
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_status(request):
    """
    Returns current clock-in status for the authenticated user.
    """
    try:
        employee = request.user.employee_profile

        # Check for active attendance (clocked in but not clocked out)
        active = Attendance.objects.filter(
            employee=employee,
            status='clocked_in',  # Check status
            clock_out_time__isnull=True
        ).select_related('shift').first()

        if active:
            response_data = {
                'is_clocked_in': True,
                'attendance_id': active.id,
                'clock_in_time': active.clock_in_time,
                'duration_so_far': calculate_current_duration(active.clock_in_time),
            }

            # Include shift info if linked
            if active.shift:
                response_data['shift'] = {
                    'id': active.shift.id,
                    'shift_type': active.shift.shift_type,
                    'scheduled_start': active.shift.shift_start_time,
                    'scheduled_end': active.shift.shift_end_time,
                }

            return Response(response_data)
        else:
            #  Check if there's a scheduled shift for today
            today_shift = Shift.objects.filter(
                shift_agent=employee,
                shift_date=date.today()
            ).first()

            response_data = {'is_clocked_in': False}

            if today_shift:
                response_data['upcoming_shift'] = {
                    'id': today_shift.id,
                    'shift_type': today_shift.shift_type,
                    'scheduled_start': today_shift.shift_start_time,
                    'scheduled_end': today_shift.shift_end_time,
                }

            return Response(response_data)

    except Employee.DoesNotExist:
        return Response({'detail': 'Employee profile not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)


#clock in
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_in(request):
    """
    Clock in for work. Automatically links to today's shift if one exists.
    """
    try:
        employee = request.user.employee_profile

        # Check if already clocked in
        active = Attendance.objects.filter(
            employee=employee,
            status='clocked_in',
            clock_out_time__isnull=True
        ).first()

        if active:
            return Response(
                {
                    'detail': 'Already clocked in',
                    'clock_in_time': active.clock_in_time
                },
                status=400
            )

        # Check for scheduled shift today
        today_shift = Shift.objects.filter(
            shift_agent=employee,
            shift_date=date.today()
        ).first()

        # Create new attendance record with shift link
        attendance = Attendance.objects.create(
            employee=employee,
            shift=today_shift,  # Links to shift if exists, None if unscheduled
            clock_in_time=timezone.now(),
            status='clocked_in'  # Set status
        )

        #  Update shift status if linked
        if today_shift:
            today_shift.shift_status = 'In_Progress'
            today_shift.save()

        response_data = {
            'message': 'Clocked in successfully',
            'attendance_id': attendance.id,
            'clock_in_time': attendance.clock_in_time,
            'status': attendance.status,
        }

        # Include shift info if available
        if today_shift:
            response_data['shift'] = {
                'id': today_shift.id,
                'shift_type': today_shift.shift_type,
                'scheduled_start': today_shift.shift_start_time,
                'scheduled_end': today_shift.shift_end_time,
            }
            response_data['is_scheduled'] = True
        else:
            response_data['is_scheduled'] = False
            response_data['note'] = 'Unscheduled work - no shift assigned'

        return Response(response_data, status=201)

    except Employee.DoesNotExist:
        return Response({'detail': 'Employee profile not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)


#  Clock Out (UPDATED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_out(request):
    """
    Clock out from work. Duration is automatically calculated.
    Prompts user to submit end-of-shift report.
    """
    try:
        employee = request.user.employee_profile

        # Find active clock-in
        active = Attendance.objects.filter(
            employee=employee,
            status='clocked_in',
            clock_out_time__isnull=True
        ).select_related('shift').first()

        if not active:
            return Response(
                {'detail': 'Not clocked in'},
                status=400
            )

        #  Update with clock-out time and status
        active.clock_out_time = timezone.now()
        active.status = 'clocked_out'
        active.save()  # Duration calculated automatically by model!

        # Update shift status if linked
        if active.shift:
            active.shift.shift_status = 'Shift_Completed'
            active.shift.save()

        response_data = {
            'message': 'Clocked out successfully',
            'attendance_id': active.id,
            'clock_in_time': active.clock_in_time,
            'clock_out_time': active.clock_out_time,
            'duration_hours': active.duration_hours,
            'prompt_report': True,  #  Signal frontend to show report form
        }

        # Include shift info for context
        if active.shift:
            # Calculate variance
            scheduled_duration = calculate_scheduled_duration(active.shift)
            variance = active.duration_hours - scheduled_duration if scheduled_duration else 0

            response_data['shift'] = {
                'id': active.shift.id,
                'shift_type': active.shift.shift_type,
                'scheduled_start': active.shift.shift_start_time,
                'scheduled_end': active.shift.shift_end_time,
                'scheduled_duration': scheduled_duration,
                'variance_hours': round(variance, 2),
            }

        return Response(response_data)

    except Employee.DoesNotExist:
        return Response({'detail': 'Employee profile not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)


#  Helper function for current duration
def calculate_current_duration(clock_in_time):
    """Calculate how long user has been clocked in"""
    if clock_in_time:
        delta = timezone.now() - clock_in_time
        hours = delta.total_seconds() / 3600
        return round(hours, 2)
    return 0


# Helper function for scheduled duration
def calculate_scheduled_duration(shift):
    """Calculate expected shift duration in hours"""
    from datetime import datetime, timedelta

    if shift and shift.shift_start_time and shift.shift_end_time:
        # Combine with today's date for calculation
        start = datetime.combine(date.today(), shift.shift_start_time)
        end = datetime.combine(date.today(), shift.shift_end_time)

        # Handle overnight shifts
        if end < start:
            end += timedelta(days=1)

        delta = end - start
        return round(delta.total_seconds() / 3600, 2)
    return None


#  fetch today's attendance summary
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_summary(request):
    """
    Get summary of today's attendance and shift info.
    Useful for dashboard display.
    """
    try:
        employee = request.user.employee_profile
        today = date.today()

        # Get today's attendance records
        today_attendances = Attendance.objects.filter(
            employee=employee,
            date=today
        ).select_related('shift')

        # Get today's shift
        today_shift = Shift.objects.filter(
            shift_agent=employee,
            shift_date=today
        ).first()

        response_data = {
            'date': today,
            'has_shift': today_shift is not None,
            'attendances': [],
        }

        if today_shift:
            response_data['shift'] = {
                'id': today_shift.id,
                'shift_type': today_shift.shift_type,
                'scheduled_start': today_shift.shift_start_time,
                'scheduled_end': today_shift.shift_end_time,
                'status': today_shift.shift_status,
            }

        for attendance in today_attendances:
            response_data['attendances'].append({
                'id': attendance.id,
                'clock_in_time': attendance.clock_in_time,
                'clock_out_time': attendance.clock_out_time,
                'duration_hours': attendance.duration_hours,
                'status': attendance.status,
            })

        return Response(response_data)

    except Employee.DoesNotExist:
        return Response({'detail': 'Employee profile not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)


# List view - use list serializer
@api_view(['GET'])
def attendance_history(request):
    attendances = Attendance.objects.filter(
        employee=request.user.employee_profile
    ).select_related('shift', 'employee__user')

    serializer = AttendanceListSerializer(attendances, many=True)
    return Response(serializer.data)


# Detail view - use detail serializer
@api_view(['GET'])
def attendance_detail(request, pk):
    attendance = Attendance.objects.select_related(
        'shift', 'employee__user'
    ).get(pk=pk)

    serializer = AttendanceDetailSerializer(attendance)
    return Response(serializer.data)


# Clock in - use detail serializer for response
@api_view(['POST'])
def clock_in(request):
    # ... your existing clock_in logic ...
    attendance = Attendance.objects.create(...)

    # Return detailed info
    serializer = AttendanceDetailSerializer(attendance)
    return Response(serializer.data, status=201)


# Supervisor view - use supervisor serializer
@api_view(['GET'])
def team_attendance(request):
    team_attendances = Attendance.objects.filter(
        employee__supervisor=request.user.employee_profile,
        date=today
    ).select_related('shift', 'employee__user')

    serializer = AttendanceSupervisorSerializer(team_attendances, many=True)
    return Response(serializer.data)