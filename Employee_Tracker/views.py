from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta, date

from rest_framework import viewsets, filters
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from accounts.models import Employee, Department
from accounts.permissions import UserTypeReportPermission, UserShiftPermission, CanEditOwnProfile, DepartmentViewPermission
from .models import Shift, ActivityReport, Attendance
from .serializers import (
    EmployeeProfileSerializer, ShiftSerializer, DepartmentSerializer,
    ActivityReportSerializer, AttendanceStatsSerializer, AttendanceUpdateSerializer,
    AttendanceSupervisorSerializer, AttendanceListSerializer
)

User = get_user_model()


# ===========================
# DEPARTMENT VIEWS
# ===========================
class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated, DepartmentViewPermission]

    def get_queryset(self):
        return Department.objects.all()


# ===========================
# EMPLOYEE PROFILE VIEWS
# ===========================
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated, CanEditOwnProfile]

    def get_queryset_getattr(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return Employee.objects.all()
        profile = getattr(user, 'employee_profile', None)
        if profile and profile.department:
            return Employee.objects.filter(department=profile.department)
        return Employee.objects.none()

    @action(detail=False, methods=['GET', 'PUT', 'PATCH'], url_path='me')
    def me(self, request):
        try:
            profile = request.user.employee_profile
        except AttributeError:
            return Response({"error": "User has no employee profile"})

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
        else:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(serializer.data)


# ===========================
# SHIFT VIEWS
# ===========================
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent__user__username', 'shift_type', 'shift_status']
    ordering_fields = ['shift_date', 'shift_start_time', 'shift_created_at']
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated, UserShiftPermission]

    def get_queryset(self):
        user = self.request.user
        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            return Shift.objects.none()

        qs = Shift.objects.select_related(
            'shift_agent__user', 'shift_agent__department', 'created_by__user'
        ).prefetch_related('attendances')

        if employee_profile.user_type in ['admin','superuser','staff']:
            return qs.all()
        elif employee_profile.user_type in ['supervisor', 'manager']:
            return qs.filter(models.Q(shift_agent__supervisor=employee_profile) | models.Q(shift_agent=employee_profile))
        else:
            return qs.filter(shift_agent=employee_profile)

    def perform_create(self, serializer):
        user = self.request.user
        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        shift_agent_id = self.request.data.get('shift_agent')
        if employee_profile.user_type in ['Supervisor', 'Manager', 'Admin'] and shift_agent_id:
            try:
                shift_agent = Employee.objects.get(id=shift_agent_id)
                if employee_profile.user_type != 'Admin' and shift_agent.supervisor != employee_profile:
                    raise ValidationError({'error': 'Can only create shifts for your team'})
            except Employee.DoesNotExist:
                raise ValidationError({'error': 'Employee not found'})
        else:
            shift_agent = employee_profile

        if Shift.objects.filter(shift_agent=shift_agent, shift_status='shift_in_progress').exists():
            raise ValidationError({'error': 'You already have an active shift'})

        shift = serializer.save(
            shift_agent=shift_agent,
            shift_date=date.today(),
            shift_start_time=timezone.now().time(),
            shift_status='shift_in_progress',
            created_by=employee_profile
        )

        Attendance.objects.create(
            employee=shift_agent,
            shift=shift,
            clock_in_time=timezone.now(),
            status='clocked_in'
        )

    def perform_update(self, serializer):
        shift = self.get_object()
        user = self.request.user
        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        if shift.shift_status == 'shift_completed':
            raise ValidationError({'error': 'Cannot modify a completed shift'})

        if employee_profile.user_type != 'Admin':
            if shift.shift_agent != employee_profile and shift.shift_agent.supervisor != employee_profile:
                raise ValidationError({'error': 'Can only modify your shifts or your team shifts'})

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            raise ValidationError({'error': 'Employee profile not found'})

        if instance.shift_status in ['shift_in_progress', 'shift_completed']:
            raise ValidationError({'error': 'Cannot delete an active or completed shift'})

        if employee_profile.user_type != 'Admin':
            if instance.shift_agent != employee_profile and instance.shift_agent.supervisor != employee_profile:
                raise ValidationError({'error': 'Can only delete your shifts or your team shifts'})

        instance.delete()

    # Extra endpoints: today, upcoming, cancel, my-shifts
    @action(detail=False, methods=['get'], url_path='today')
    def today_shifts(self, request):
        user = request.user
        try:
            employee = user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()
        if employee.user_type == 'Admin':
            shifts = Shift.objects.filter(shift_date=today)
        elif employee.user_type in ['Supervisor', 'Manager']:
            shifts = Shift.objects.filter(shift_date=today).filter(models.Q(shift_agent__supervisor=employee) | models.Q(shift_agent=employee))
        else:
            shifts = Shift.objects.filter(shift_date=today, shift_agent=employee)

        serializer = self.get_serializer(shifts, many=True)
        return Response({'date': today, 'count': shifts.count(), 'shifts': serializer.data})

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_shifts(self, request):
        user = request.user
        try:
            employee = user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()
        next_week = today + timedelta(days=7)

        if employee.user_type == 'Admin':
            shifts = Shift.objects.filter(shift_date__range=[today, next_week], shift_status='shift_scheduled')
        elif employee.user_type in ['Supervisor', 'Manager']:
            shifts = Shift.objects.filter(shift_date__range=[today, next_week]).filter(models.Q(shift_agent__supervisor=employee) | models.Q(shift_agent=employee), shift_status='shift_scheduled')
        else:
            shifts = Shift.objects.filter(shift_date__range=[today, next_week], shift_agent=employee, shift_status='shift_scheduled')

        serializer = self.get_serializer(shifts.order_by('shift_date', 'shift_start_time'), many=True)
        return Response({'start_date': today, 'end_date': next_week, 'count': shifts.count(), 'shifts': serializer.data})

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel_shift(self, request, pk=None):
        shift = self.get_object()
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        if employee.user_type not in ['Supervisor', 'Manager', 'Admin']:
            return Response({'error': 'Only supervisors/admins can cancel shifts'}, status=403)

        if shift.shift_status in ['shift_in_progress', 'shift_completed']:
            return Response({'error': 'Cannot cancel an active or completed shift'}, status=400)

        if employee.user_type != 'Admin' and shift.shift_agent.supervisor != employee:
            return Response({'error': 'Can only cancel shifts of your team'}, status=403)

        shift.shift_status = 'shift_cancelled'
        shift.save()
        serializer = self.get_serializer(shift)
        return Response({'message': 'Shift cancelled', 'shift': serializer.data})

    @action(detail=False, methods=['get'], url_path='my-shifts')
    def my_shifts(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=404)

        today = date.today()
        past_30 = today - timedelta(days=30)
        next_30 = today + timedelta(days=30)

        shifts = Shift.objects.filter(shift_agent=employee, shift_date__range=[past_30, next_30]).order_by('-shift_date')
        serializer = self.get_serializer(shifts, many=True)
        return Response({'employee': employee.user.username, 'count': shifts.count(), 'shifts': serializer.data})


# ===========================
# REPORTS VIEW
# ===========================
class ReportsViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    serializer_class = ActivityReportSerializer
    permission_classes = [IsAuthenticated, UserTypeReportPermission]
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type', 'activity_status']
    ordering_fields = ['activity_type', 'activity_status']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        employee_profile = self.request.user.employee_profile
        if employee_profile.user_type == 'Supervisor':
            return ActivityReport.objects.filter(employee__supervisor=employee_profile)
        return ActivityReport.objects.filter(employee=employee_profile)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        report = self.get_object()
        current_supervisor = request.user.employee_profile

        if report.employee.supervisor != current_supervisor and current_supervisor.user_type != 'Admin':
            return Response({'detail': 'Can only approve reports from direct reports'}, status=403)

        report.is_approved = True
        report.approved_by = current_supervisor
        report.activity_approved_at = timezone.now()
        report.save()
        return Response({'status': 'approved'})


# ===========================
# ATTENDANCE VIEWSET (all endpoints merged)
# ===========================
class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, UserTypeReportPermission]

    def get_queryset(self):
        user = self.request.user
        try:
            employee_profile = user.employee_profile
        except Employee.DoesNotExist:
            return Attendance.objects.none()

        qs = Attendance.objects.select_related('shift', 'employee__user')

        if employee_profile.user_type == 'Admin':
            return qs.all()
        elif employee_profile.user_type in ['Supervisor', 'Manager']:
            return qs.filter(employee__supervisor=employee_profile) | qs.filter(employee=employee_profile)
        return qs.filter(employee=employee_profile)

    def get_serializer_class(self):
        return AttendanceListSerializer

    # =========================
    # Clock-in / Clock-out / Status / Today-summary
    # =========================
    @action(detail=False, methods=['GET'], url_path='status')
    def status(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee profile not found'}, status=404)

        active = Attendance.objects.filter(employee=employee, status='clocked_in', clock_out_time__isnull=True).select_related('shift').first()
        today_shift = Shift.objects.filter(shift_agent=employee, shift_date=date.today()).first()

        if active:
            response = {
                'is_clocked_in': True,
                'attendance_id': active.id,
                'clock_in_time': active.clock_in_time,
                'duration_so_far': calculate_current_duration(active.clock_in_time),
            }
            if active.shift:
                response['shift'] = {
                    'id': active.shift.id,
                    'shift_type': active.shift.shift_type,
                    'scheduled_start': active.shift.shift_start_time,
                    'scheduled_end': active.shift.shift_end_time,
                }
            return Response(response)

        response = {'is_clocked_in': False}
        if today_shift:
            response['upcoming_shift'] = {
                'id': today_shift.id,
                'shift_type': today_shift.shift_type,
                'scheduled_start': today_shift.shift_start_time,
                'scheduled_end': today_shift.shift_end_time,
            }
        return Response(response)

    @action(detail=False, methods=['POST'], url_path='clock-in')
    def clock_in(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee profile not found'}, status=404)

        active = Attendance.objects.filter(employee=employee, status='clocked_in', clock_out_time__isnull=True).first()
        if active:
            return Response({'detail': 'Already clocked in', 'attendance_id': active.id, 'clock_in_time': active.clock_in_time}, status=400)

        today_shift = Shift.objects.filter(shift_agent=employee, shift_date=date.today()).first()
        attendance = Attendance.objects.create(
            employee=employee,
            shift=today_shift,
            clock_in_time=timezone.now(),
            status='clocked_in'
        )
        if today_shift:
            today_shift.shift_status = 'In_Progress'
            today_shift.save()

        response = {
            'message': 'Clocked in successfully',
            'attendance_id': attendance.id,
            'clock_in_time': attendance.clock_in_time,
            'status': attendance.status,
            'is_scheduled': bool(today_shift)
        }
        if today_shift:
            response['shift'] = {
                'id': today_shift.id,
                'shift_type': today_shift.shift_type,
                'scheduled_start': today_shift.shift_start_time,
                'scheduled_end': today_shift.shift_end_time
            }
        else:
            response['note'] = 'Unscheduled work - no shift assigned'

        return Response(response, status=201)

    @action(detail=False, methods=['POST'], url_path='clock-out')
    def clock_out(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee profile not found'}, status=404)

        active = Attendance.objects.filter(employee=employee, status='clocked_in', clock_out_time__isnull=True).select_related('shift').first()
        if not active:
            return Response({'detail': 'Not clocked in'}, status=400)

        active.clock_out_time = timezone.now()
        active.status = 'clocked_out'
        active.save()

        if active.shift:
            active.shift.shift_status = 'Shift_Completed'
            active.shift.save()

        response = {
            'message': 'Clocked out successfully',
            'attendance_id': active.id,
            'clock_in_time': active.clock_in_time,
            'clock_out_time': active.clock_out_time,
            'duration_hours': active.duration_hours,
            'prompt_report': True
        }
        if active.shift:
            scheduled_duration = calculate_scheduled_duration(active.shift)
            variance = float(active.duration_hours) - scheduled_duration if scheduled_duration else 0
            response['shift'] = {
                'id': active.shift.id,
                'shift_type': active.shift.shift_type,
                'scheduled_start': active.shift.shift_start_time,
                'scheduled_end': active.shift.shift_end_time,
                'scheduled_duration': scheduled_duration,
                'variance_hours': round(variance, 2)
            }

        return Response(response)

    @action(detail=False, methods=['GET'], url_path='today')
    def today(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee profile not found'}, status=404)

        today = date.today()
        attendances = Attendance.objects.filter(employee=employee, date=today).select_related('shift')

        today_shift = Shift.objects.filter(shift_agent=employee, shift_date=today).first()
        summary = {'date': today, 'has_shift': bool(today_shift), 'attendances': []}
        if today_shift:
            summary['shift'] = {
                'id': today_shift.id,
                'shift_type': today_shift.shift_type,
                'scheduled_start': today_shift.shift_start_time,
                'scheduled_end': today_shift.shift_end_time,
                'status': today_shift.shift_status
            }

        for a in attendances:
            summary['attendances'].append({
                'id': a.id,
                'clock_in_time': a.clock_in_time,
                'clock_out_time': a.clock_out_time,
                'duration_hours': a.duration_hours,
                'status': a.status
            })

        return Response(summary)


# ===========================
# HELPER FUNCTIONS
# ===========================
def calculate_current_duration(clock_in_time):
    if clock_in_time:
        delta = timezone.now() - clock_in_time
        return round(delta.total_seconds() / 3600, 2)
    return 0


def calculate_scheduled_duration(shift):
    if shift and shift.shift_start_time and shift.shift_end_time:
        start = datetime.combine(date.today(), shift.shift_start_time)
        end = datetime.combine(date.today(), shift.shift_end_time)
        if end < start:
            end += timedelta(days=1)
        delta = end - start
        return round(delta.total_seconds() / 3600, 2)
    return None