from rest_framework import viewsets, status
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
from django.http import HttpResponse


from accounts.models import Employee, Department
from accounts.permissions import UserShiftPermission
from .models import Shift, ActivityReport, Attendance,StaticShift
from .serializers import (
    EmployeeProfileSerializer, ShiftSerializer, DepartmentSerializer,ActivityReportSupervisorSerializer,
    ActivityReportEmployeeSerializer, AttendanceStatsSerializer,AttendanceSupervisorSerializer, AttendanceListSerializer,StaticShiftSerializer
)
import logging
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO

User = get_user_model()
today = timezone.localdate()
logger = logging.getLogger(__name__)


# ===========================
# DEPARTMENT VIEWS
# ===========================
class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Department.objects.all()



# ===========================
# EMPLOYEE PROFILE VIEWS
# ===========================
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]

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
# STATIC SHIFT VIEWSET TEMPLATE
# ===========================
class StaticShiftViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    queryset = StaticShift.objects.all()
    serializer_class = StaticShiftSerializer


# ===========================
# SHIFT VIEWS
# ===========================
class ShiftAPIViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent__user__username', 'shift_status']
    ordering_fields = ['shift_date','shift_created_at']
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination


    def get_queryset(self):
        user = self.request.user
        """Only return shifts assigned to logged-in user"""
        try:
            employee = user.employee_profile  # Get the Employee object linked to this user
            if employee.user_type in ['superuser', 'admin']:
                return Shift.objects.all()

            elif employee.user_type in ['supervisor', 'manager']:
                return Shift.objects.filter(shift_agent__supervisor=employee)

            else:
                return Shift.objects.filter(
                shift_agent=employee,  #  Pass Employee object, not username
            ).select_related('static_shift')
        except Employee.DoesNotExist:
            raise ValidationError ('Employee profile or details not found')

    @action(detail=False, methods=['get'])
    def today_shifts(self, request):
        """Get user's shifts for today"""
        today = timezone.now().date()
        shifts = self.get_queryset().filter(shift_date=today)
        serializer = self.get_serializer(shifts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_shifts(self, request):
        """Get upcoming shifts (next 7 days)"""
        today = timezone.now().date()
        week_later = today + timedelta(days=7)
        shifts = self.get_queryset().filter(
            shift_date__gte=today,
            shift_date__lte=week_later,
            shift_status='shift_scheduled'
        )
        serializer = self.get_serializer(shifts, many=True)
        return Response(serializer.data)



# ===========================
# REPORTS VIEW
# ===========================
class ReportsViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    ordering = ['-activity_submitted_at']

    def is_supervisor(self):
        """Check if current user is a supervisor"""
        try:
            employee = self.request.user.employee_profile
            # Debug: Print the user type
            print(f"DEBUG: User {self.request.user} is type: {employee.user_type}")
            return employee.user_type == 'supervisor'
        except Exception as e:
            print(f"DEBUG: Error checking supervisor: {e}")
            return False

    def get_serializer_class(self):
        """Return different serializers based on user role"""
        if self.is_supervisor():
            print("DEBUG: Using SupervisorSerializer")
            return ActivityReportSupervisorSerializer
        else:
            print("DEBUG: Using EmployeeSerializer")
            return ActivityReportEmployeeSerializer


    def get_serializer_class(self):
        """Return different serializers based on user role"""
        try:
            employee = self.request.user.employee_profile
            if employee.user_type == 'supervisor':
                return ActivityReportSupervisorSerializer
        except Employee.DoesNotExist:
            pass

        return ActivityReportEmployeeSerializer

    def get_queryset(self):
        """
        Filter reports based on user role.
        - Supervisors see their team's reports
        - Employees see only their own reports
        """
        user = self.request.user

        try:
            employee = user.employee_profile
        except Employee.DoesNotExist:
            return ActivityReport.objects.none()

        # Check user type
        if employee.user_type == 'supervisor':
            # Supervisors see reports of employees they supervise
            return ActivityReport.objects.filter(
                employee__supervisor=employee
            ).order_by('-activity_submitted_at')

        # Regular employees see only their own reports
        return ActivityReport.objects.filter(
            employee=employee
        ).order_by('-activity_submitted_at')

    def create(self, request, *args, **kwargs):
        """Employee submits a report"""
        try:
            attendance_id = request.data.get('attendance')

            try:
                employee = request.user.employee_profile
                attendance = Attendance.objects.get(
                    id=attendance_id,
                    employee=employee
                )
            except Attendance.DoesNotExist:
                return Response(
                    {'error': 'Attendance record not found or does not belong to you'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Employee.DoesNotExist:
                return Response(
                    {'error': 'User has no employee profile'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if report already exists
            if ActivityReport.objects.filter(attendance=attendance).exists():
                return Response(
                    {'error': 'Report already submitted for this shift'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate clock_out
            if not attendance.clock_out_time:
                return Response(
                    {'error': 'Cannot submit report. Shift not yet completed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create report
            report = ActivityReport.objects.create(
                employee=employee,
                attendance=attendance,
                shift_activity_type=request.data.get('shift_activity_type', 'Night_Shift'),
                report_type=request.data.get('report_type', 'other'),
                activity_description=request.data.get('activity_description', ''),
                tickets_resolved=request.data.get('tickets_resolved', 0),
                calls_made=request.data.get('calls_made', 0),
                issues_escalated=request.data.get('issues_escalated', 0),
                notes=request.data.get('notes', '')
            )

            logger.info(f"Report submitted by {request.user} for attendance {attendance_id}")

            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating report: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Supervisor approves a report"""
        report = self.get_object()

        try:
            supervisor = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response(
                {'error': 'User has no employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if supervisor.user_type != 'supervisor':
            return Response(
                {'error': 'Only supervisors can approve reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        if report.employee.supervisor != supervisor:
            return Response(
                {'error': 'You can only approve reports for your team'},
                status=status.HTTP_403_FORBIDDEN
            )

        if report.is_approved:
            return Response(
                {'error': 'Report already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.is_approved = True
        report.activity_approved_at = timezone.now()
        report.approved_by = supervisor
        report.save()

        logger.info(f"Report {pk} approved by {request.user}")

        serializer = self.get_serializer(report)
        return Response(
            {'message': 'Report approved', 'data': serializer.data},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Supervisor rejects a report"""
        report = self.get_object()

        try:
            supervisor = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response(
                {'error': 'User has no employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if supervisor.user_type != 'supervisor':
            return Response(
                {'error': 'Only supervisors can reject reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        if report.is_approved:
            return Response(
                {'error': 'Cannot reject an approved report'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.delete()
        logger.info(f"Report {pk} rejected by {request.user}")

        return Response(
            {'message': 'Report rejected'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get pending reports for supervisor"""
        try:
            supervisor = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response(
                {'error': 'User has no employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if supervisor.user_type != 'supervisor':
            return Response(
                {'error': 'Only supervisors can view pending reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        pending = ActivityReport.objects.filter(
            employee__supervisor=supervisor,
            is_approved=False
        ).order_by('activity_submitted_at')

        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download approved report as PDF"""
        report = self.get_object()

        # Only approved reports can be downloaded
        if not report.is_approved:
            return Response(
                {'error': 'Only approved reports can be downloaded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor='#003366',
            spaceAfter=20,
            alignment=1  # Center
        )

        # Title
        elements.append(Paragraph("Activity Report", title_style))
        elements.append(Spacer(1, 0.3 * inch))

        # Report Details
        report_data = [
            ['Field', 'Value'],
            ['Employee', report.employee.user.get_full_name()],
            ['Report Type', report.get_report_type_display()],
            ['Shift Type', report.shift_activity_type],
            ['Submitted Date', report.activity_submitted_at.strftime('%Y-%m-%d %H:%M')],
            ['Approved By', report.approved_by.user.get_full_name() if report.approved_by else 'N/A'],
            ['Approval Date',
             report.activity_approved_at.strftime('%Y-%m-%d %H:%M') if report.activity_approved_at else 'N/A'],
            ['Tickets Resolved', str(report.tickets_resolved)],
            ['Calls Made', str(report.calls_made)],
            ['Issues Escalated', str(report.issues_escalated)],
        ]

        table = Table(report_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), '#003366'),
            ('TEXTCOLOR', (0, 0), (-1, 0), '#FFFFFF'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, '#CCCCCC'),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 0.3 * inch))

        # Description
        elements.append(Paragraph("<b>Activity Description:</b>", styles['Normal']))
        elements.append(Paragraph(report.activity_description, styles['Normal']))
        elements.append(Spacer(1, 0.2 * inch))

        # Notes
        elements.append(Paragraph("<b>Notes:</b>", styles['Normal']))
        elements.append(Paragraph(report.notes, styles['Normal']))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        logger.info(f"Report {pk} downloaded by {request.user}")

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{report.id}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get activity analytics"""
        employee_id = request.query_params.get('employee_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        queryset = ActivityReport.objects.filter(is_approved=True)

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if date_from:
            queryset = queryset.filter(activity_submitted_at__gte=date_from)

        if date_to:
            queryset = queryset.filter(activity_submitted_at__lte=date_to)

        analytics = {
            'total_reports': queryset.count(),
            'total_tickets_resolved': queryset.aggregate(Sum('tickets_resolved'))['tickets_resolved__sum'] or 0,
            'total_calls_made': queryset.aggregate(Sum('calls_made'))['calls_made__sum'] or 0,
            'total_issues_escalated': queryset.aggregate(Sum('issues_escalated'))['issues_escalated__sum'] or 0,
            'reports_by_type': dict(
                queryset.values('report_type').annotate(count=Count('id')).values_list('report_type', 'count')
            ),
            'reports_by_shift': dict(
                queryset.values('shift_activity_type').annotate(count=Count('id')).values_list('shift_activity_type',
                                                                                               'count')
            )
        }

        return Response(analytics)

# ===========================
# ATTENDANCE VIEWSET (all endpoints merged)
# ===========================
class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    serializer_class = AttendanceListSerializer
    queryset = Attendance.objects.all()

    def get_queryset(self):
        return Attendance.objects.filter(employee=self.request.user.employee_profile)

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        """User clocks in to a shift"""
        shift_id = request.data.get('shift_id')

        try:
            shift = Shift.objects.get(id=shift_id, shift_agent=request.user.employee_profile)
        except Shift.DoesNotExist:
            return Response({'error': 'Shift not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if already clocked in
        existing = Attendance.objects.filter(
            employee=request.user.employee_profile,
            shift_attendance=shift,
            clock_out_time__isnull=True
        ).exists()

        if existing:
            return Response({'error': 'Already clocked in for this shift'}, status=status.HTTP_400_BAD_REQUEST)

        # Create attendance record for validation
        attendance = Attendance(
            employee=request.user.employee_profile,
            shift_attendance=shift
        )

        # Validate clock-in time
        validation_result = attendance.validate_clock_in()

        if not validation_result['success']:
            return Response(validation_result, status=status.HTTP_400_BAD_REQUEST)

        # Save attendance after validation passes
        attendance.save()

        # Update shift status
        shift.shift_status = 'shift_in_progress'
        shift.save()

        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        """User clocks out"""
        attendance_id = request.data.get('attendance_id')

        try:
            attendance = Attendance.objects.get(
                id=attendance_id,
                employee=request.user.employee_profile,
                clock_out_time__isnull=True
            )
        except Attendance.DoesNotExist:
            return Response({'error': 'No active clock-in found'}, status=status.HTTP_404_NOT_FOUND)

        # Set clock_out_time
        attendance.clock_out_time = timezone.now()

        # Validate clock-out (duration and hours check)
        validation_result = attendance.validate_clock_out()

        # Save attendance (status set by validate_clock_out)
        attendance.save()

        # Update shift status based on validation result
        if validation_result['success']:
            attendance.shift_attendance.shift_status = 'shift_completed'
        else:
            attendance.shift_attendance.shift_status = 'shift_incomplete'  # Didn't meet hours

        attendance.shift_attendance.save()

        # Return validation result with attendance data
        response_data = {
            **validation_result,
            'attendance': self.get_serializer(attendance).data
        }

        http_status = status.HTTP_200_OK if validation_result['success'] else status.HTTP_400_BAD_REQUEST
        return Response(response_data, status=http_status)
