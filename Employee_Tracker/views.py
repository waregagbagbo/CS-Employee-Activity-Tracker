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
from datetime import datetime, timedelta,date
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


""" Employee Profile view """
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
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class ShiftAPIViewSet(viewsets.ModelViewSet):
    """
    Manage shift SCHEDULES (planned work times).
    Actual work time is tracked via Attendance model.

    Endpoints:
    - GET /shifts/ - List shifts
    - POST /shifts/ - Create shift (supervisors only)
    - GET /shifts/{id}/ - Get shift details
    - PUT/PATCH /shifts/{id}/ - Update shift
    - DELETE /shifts/{id}/ - Delete shift
    - GET /shifts/today/ - Today's shifts
    - GET /shifts/upcoming/ - Next 7 days shifts
    - PATCH /shifts/{id}/cancel/ - Cancel shift
    """
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent__user__username', 'shift_type', 'shift_status']
    ordering_fields = ['shift_date', 'shift_start_time', 'shift_created_at']
    authentication_classes = [SessionAuthentication,IsAuthenticated]
    permission_classes = [IsAuthenticated, UserShiftPermission]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """
        Return shifts based on user_type:
        - Admin: View all shifts
        - Supervisor/Manager: View shifts for their team
        - Employee_Agent: View only their own shifts
        """
        user = self.request.user

        if not user.is_authenticated:
            return Shift.objects.none()

        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            return Shift.objects.none()

        #  Optimized base queryset
        base_queryset = Shift.objects.select_related(
            'shift_agent__user',
            'shift_agent__department',
            'created_by__user'
        ).prefetch_related('attendances')

        #  Filter based on user type
        if employee_profile.user_type == 'Admin':
            return base_queryset.all()

        elif employee_profile.user_type in ['Supervisor', 'Manager']:
            # Supervisors see their team's shifts + their own
            return base_queryset.filter(
                models.Q(shift_agent__supervisor=employee_profile) |
                models.Q(shift_agent=employee_profile)
            )

        else:  # Employee_Agent
            return base_queryset.filter(shift_agent=employee_profile)

    def perform_create(self, serializer):
        """
        Create shift schedule.
        Only supervisors/admins can create shifts for their team.
        """
        user = self.request.user

        try:
            creator_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        #  Only supervisors/managers/admins can create shifts
        if creator_profile.user_type not in ['Supervisor', 'Manager', 'Admin']:
            raise ValidationError({
                'error': 'Only supervisors and admins can create shifts'
            })

        #  Validate shift_agent is provided
        shift_agent_id = self.request.data.get('shift_agent')
        if not shift_agent_id:
            raise ValidationError({'error': 'shift_agent is required'})

        try:
            shift_agent = Employee.objects.get(id=shift_agent_id)

            #  Check supervisor can only create shifts for their team
            if creator_profile.user_type != 'Admin':
                if shift_agent.supervisor != creator_profile:
                    raise ValidationError({
                        'error': 'You can only create shifts for employees under your supervision'
                    })

            #  Save with created_by tracking
            serializer.save(created_by=creator_profile)

        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee not found'})

    def perform_update(self, serializer):
        """
        Update shift - only if not completed.
        """
        shift = self.get_object()
        user = self.request.user

        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        #  Can't modify completed shifts
        if shift.shift_status == 'Shift_Completed':
            raise ValidationError({
                'error': 'Cannot modify a completed shift'
            })

        #  Only supervisor of the shift agent or admin can update
        if employee_profile.user_type != 'Admin':
            if shift.shift_agent.supervisor != employee_profile:
                raise ValidationError({
                    'error': 'You can only modify shifts for your team'
                })

        serializer.save()

    def perform_destroy(self, instance):
        """
        Delete shift - only if not started.
        """
        user = self.request.user

        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        #  Can't delete if shift has started or completed
        if instance.shift_status in ['In_Progress', 'Shift_Completed']:
            raise ValidationError({
                'error': f'Cannot delete a {instance.shift_status.lower()} shift'
            })

        #  Only supervisor or admin can delete
        if employee_profile.user_type != 'Admin':
            if instance.shift_agent.supervisor != employee_profile:
                raise ValidationError({
                    'error': 'You can only delete shifts for your team'
                })

        instance.delete()

    @action(detail=False, methods=['get'], url_path='today')
    def today_shifts(self, request):
        """
        Get today's shifts for current user or their team.
        Useful for dashboard display.

        GET /api/shifts/today/
        """
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()

        #  Filter based on user type
        if employee.user_type == 'Admin':
            shifts = Shift.objects.filter(shift_date=today)
        elif employee.user_type in ['Supervisor', 'Manager']:
            shifts = Shift.objects.filter(
                models.Q(shift_date=today) &
                (
                        models.Q(shift_agent__supervisor=employee) |
                        models.Q(shift_agent=employee)
                )
            )
        else:  # Employee_Agent
            shifts = Shift.objects.filter(
                shift_date=today,
                shift_agent=employee
            )

        shifts = shifts.select_related('shift_agent__user').prefetch_related('attendances')
        serializer = self.get_serializer(shifts, many=True)

        return Response({
            'date': today,
            'count': shifts.count(),
            'shifts': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_shifts(self, request):
        """
        Get upcoming shifts (next 7 days).

        GET /api/shifts/upcoming/
        """
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()
        next_week = today + timedelta(days=7)

        #  Filter based on user type
        if employee.user_type == 'Admin':
            shifts = Shift.objects.filter(
                shift_date__gte=today,
                shift_date__lte=next_week,
                shift_status='Scheduled'
            )
        elif employee.user_type in ['Supervisor', 'Manager']:
            shifts = Shift.objects.filter(
                models.Q(shift_date__gte=today) &
                models.Q(shift_date__lte=next_week) &
                models.Q(shift_status='Scheduled') &
                (
                        models.Q(shift_agent__supervisor=employee) |
                        models.Q(shift_agent=employee)
                )
            )
        else:  # Employee_Agent
            shifts = Shift.objects.filter(
                shift_date__gte=today,
                shift_date__lte=next_week,
                shift_agent=employee,
                shift_status='Scheduled'
            )

        shifts = shifts.select_related('shift_agent__user').order_by('shift_date', 'shift_start_time')
        serializer = self.get_serializer(shifts, many=True)

        return Response({
            'start_date': today,
            'end_date': next_week,
            'count': shifts.count(),
            'shifts': serializer.data
        })

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel_shift(self, request, pk=None):
        """
        Cancel a scheduled shift.
        Only supervisors/admins can cancel.

        PATCH /api/shifts/{id}/cancel/
        """
        shift = self.get_object()

        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        #  Only supervisors/admins can cancel
        if employee.user_type not in ['Supervisor', 'Manager', 'Admin']:
            return Response(
                {'error': 'Only supervisors can cancel shifts'},
                status=403
            )

        # Can't cancel if already in progress or completed
        if shift.shift_status in ['In_Progress', 'Shift_Completed']:
            return Response(
                {'error': f'Cannot cancel a {shift.shift_status.lower().replace("_", " ")} shift'},
                status=400
            )

        #  Already cancelled
        if shift.shift_status == 'Cancelled':
            return Response(
                {'error': 'Shift is already cancelled'},
                status=400
            )

        # Check supervisor manages this employee
        if employee.user_type != 'Admin':
            if shift.shift_agent.supervisor != employee:
                return Response(
                    {'error': 'You can only cancel shifts for employees under your supervision'},
                    status=403
                )

        shift.shift_status = 'Cancelled'
        shift.save()

        serializer = self.get_serializer(shift)
        return Response({
            'message': 'Shift cancelled successfully',
            'shift': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my-shifts')
    def my_shifts(self, request):
        """
        Get current user's own shifts (last 30 days + upcoming).

        GET /api/shifts/my-shifts/
        """
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()
        past_30_days = today - timedelta(days=30)
        next_30_days = today + timedelta(days=30)

        shifts = Shift.objects.filter(
            shift_agent=employee,
            shift_date__gte=past_30_days,
            shift_date__lte=next_30_days
        ).select_related('shift_agent__user').prefetch_related('attendances').order_by('-shift_date')

        serializer = self.get_serializer(shifts, many=True)

        return Response({
            'employee': employee.user.username,
            'count': shifts.count(),
            'shifts': serializer.data
        })




""" Reports View """
class ReportsViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsAuthenticated, UserTypeReportPermission]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication, authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type', 'activity_status']
    ordering_fields = ['activity_type', 'activity_status']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """
        Filter what reports supervisors can even SEE.
        """
        user = self.request.user
        employee_profile = user.employee_profile

        if employee_profile.user_type == 'Supervisor':
            #  Can only see reports from employees under them
            return ActivityReport.objects.filter(
                employee__supervisor=employee_profile  # Option B
                # OR
                # shift_active_agent__supervisor=employee_profile  # Option A
            )
        # Regular employees see only their own
        return ActivityReport.objects.filter(employee=employee_profile)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a report - with supervisor check.
        """
        report = self.get_object()
        current_supervisor = request.user.employee_profile

        #  STRICT CHECK - only approve if you supervise this employee
        if report.employee.supervisor != current_supervisor:
            if current_supervisor.user_type != 'Admin':
                return Response(
                    {'detail': 'You can only approve reports from your direct reports'},
                    status=403
                )

        # Proceed with approval
        report.is_approved = True
        report.approved_by = current_supervisor
        report.activity_approved_at = timezone.now()
        report.save()
        return Response({'status': 'approved'})



# ============================================
# VIEWSET FOR ATTENDANCE CRUD
# ============================================

class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, UserTypeReportPermission]

    def get_queryset(self):
        """Filter attendance based on user role"""
        user = self.request.user

        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            return Attendance.objects.none()

        # Optimized queryset
        base_queryset = Attendance.objects.select_related(
            'shift',
            'employee__user'
        )

        # Admin sees all
        if employee_profile.user_type == 'Admin':
            return base_queryset.all()

        # Supervisor sees team + own
        if employee_profile.user_type in ['Supervisor', 'Manager']:
            return base_queryset.filter(
                employee__supervisor=employee_profile
            ) | base_queryset.filter(
                employee=employee_profile
            )

        # Employee sees only their own
        return base_queryset.filter(employee=employee_profile)

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return AttendanceListSerializer
        elif self.action == 'retrieve':
            return AttendanceDetailSerializer
        return AttendanceListSerializer

    @action(detail=False, methods=['get'], url_path='history')
    def attendance_history(self, request):
        """
        Get attendance history for current user (last 30 days).

        GET /api/attendance/history/
        """
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        thirty_days_ago = date.today() - timedelta(days=30)

        attendances = Attendance.objects.filter(
            employee=employee,
            date__gte=thirty_days_ago
        ).select_related('shift', 'employee__user').order_by('-date', '-clock_in_time')

        serializer = AttendanceListSerializer(attendances, many=True)
        return Response({
            'count': attendances.count(),
            'attendances': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='team')
    def team_attendance(self, request):
        """
        Get team's attendance (supervisors only).

        GET /api/attendance/team/
        """
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        #  Check if user is supervisor
        if employee.user_type not in ['Supervisor', 'Manager', 'Admin']:
            return Response(
                {'error': 'Only supervisors can view team attendance'},
                status=403
            )

        # Get today's date or from query params
        target_date = request.query_params.get('date', date.today())
        if isinstance(target_date, str):
            try:
                target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                target_date = date.today()

        # Get team attendance
        if employee.user_type == 'Admin':
            team_attendances = Attendance.objects.filter(date=target_date)
        else:
            team_attendances = Attendance.objects.filter(
                employee__supervisor=employee,
                date=target_date
            )

        team_attendances = team_attendances.select_related(
            'shift',
            'employee__user'
        ).order_by('employee__user__username')

        serializer = AttendanceSupervisorSerializer(team_attendances, many=True)
        return Response({
            'date': target_date,
            'count': team_attendances.count(),
            'attendances': serializer.data
        })


# ============================================
# CLOCK IN/OUT ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_status(request):
    """
    Returns current clock-in status for the authenticated user.
    Also returns associated shift info if available.

    GET /api/attendance/status/
    """
    try:
        employee = request.user.employee_profile

        # Check for active attendance (clocked in but not clocked out)
        active = Attendance.objects.filter(
            employee=employee,
            status='clocked_in',
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
            # Check if there's a scheduled shift for today
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_in(request):
    """
    Clock in for work. Automatically links to today's shift if one exists.

    POST /api/attendance/clock-in/
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
                    'clock_in_time': active.clock_in_time,
                    'attendance_id': active.id
                },
                status=400
            )

        #  Check for scheduled shift today
        today_shift = Shift.objects.filter(
            shift_agent=employee,
            shift_date=date.today()
        ).first()

        #  Create new attendance record with shift link
        attendance = Attendance.objects.create(
            employee=employee,
            shift=today_shift,  # Links to shift if exists, None if unscheduled
            clock_in_time=timezone.now(),
            status='clocked_in'
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_out(request):
    """
    Clock out from work. Duration is automatically calculated.
    Prompts user to submit end-of-shift report.

    POST /api/attendance/clock-out/
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

        #  Update shift status if linked
        if active.shift:
            active.shift.shift_status = 'Shift_Completed'
            active.shift.save()

        response_data = {
            'message': 'Clocked out successfully',
            'attendance_id': active.id,
            'clock_in_time': active.clock_in_time,
            'clock_out_time': active.clock_out_time,
            'duration_hours': active.duration_hours,
            'prompt_report': True,  # Signal frontend to show report form
        }

        #  Include shift info for context
        if active.shift:
            # Calculate variance
            scheduled_duration = calculate_scheduled_duration(active.shift)
            variance = float(
                active.duration_hours) - scheduled_duration if scheduled_duration and active.duration_hours else 0

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


# ============================================
# HELPER ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_summary(request):
    """
    Get summary of today's attendance and shift info.
    Useful for dashboard display.

    GET /api/attendance/today/
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


# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_current_duration(clock_in_time):
    """Calculate how long user has been clocked in"""
    if clock_in_time:
        delta = timezone.now() - clock_in_time
        hours = delta.total_seconds() / 3600
        return round(hours, 2)
    return 0


def calculate_scheduled_duration(shift):
    """Calculate expected shift duration in hours"""
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