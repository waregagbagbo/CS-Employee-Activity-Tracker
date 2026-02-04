from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift, ActivityReport, Attendance
from django.utils import timezone


#create the serializers for the models
class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'title','employee_count']

    def get_employee_count(self, obj):
        # Count employees in this department
        return obj.employee_set.count()
        # OR if using related_name='employees'
        # return obj.employees.count()


# Profile setup serializer
class EmployeeProfileSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    hire_date = serializers.DateField(read_only=True) # value from the model
    bio = serializers.CharField() # for posts
    user_type = serializers.CharField(read_only=True)

    class Meta:
        model = Employee

        # apply nested serializer on the fields for customization on the frontend
        fields = ['id', 'username', 'email', 'first_name', 'last_name','full_name','department','hire_date','bio','user_type']

    # create fullname
    def get_full_name(self,obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username



class ShiftSerializer(serializers.ModelSerializer):
    """
    React-friendly shift serializer with attendance status.
    """
    shift_agent = EmployeeProfileSerializer(read_only=True)
    duration_hours = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    has_attendance = serializers.SerializerMethodField()
    attendance_status = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id',
            'shift_agent',
            'shift_date',
            'shift_start_time',
            'shift_end_time',
            'shift_type',
            'shift_status',
            'duration_hours',
            'has_attendance',
            'attendance_status',
            'shift_created_at',
        ]

    #  Methods at CLASS level, not inside Meta!
    def get_has_attendance(self, obj):
        """Check if there's an attendance record for this shift"""
        return obj.attendances.exists()

    def get_attendance_status(self, obj):
        """
        Get actual work status from attendance records.
        Returns detailed status based on clock in/out state.
        """
        # Get the first (should be only) attendance for this shift
        attendance = obj.attendances.first()

        # No attendance yet
        if not attendance:
            return {
                'status': 'not_started',
                'message': 'Shift not started'
            }

        # Currently clocked in
        if attendance.status == 'clocked_in':
            if attendance.clock_in_time:
                now = timezone.now()
                duration = (now - attendance.clock_in_time).total_seconds() / 3600
                return {
                    'status': 'in_progress',
                    'message': f'Shift in progress ({round(duration, 2)} hours so far)',
                    'hours_worked': round(duration, 2)
                }

        # Clocked out
        if attendance.status == 'clocked_out':
            hours_worked = float(attendance.duration_hours) if attendance.duration_hours else 0
            scheduled_hours = obj.duration_hours

            if hours_worked >= scheduled_hours:
                return {
                    'status': 'completed',
                    'message': 'Good work, shift done for today',
                    'hours_worked': hours_worked,
                    'scheduled_hours': scheduled_hours
                }
            else:
                return {
                    'status': 'incomplete',
                    'message': f'Shift incomplete ({hours_worked} hours logged)',
                    'hours_worked': hours_worked,
                    'scheduled_hours': scheduled_hours
                }

        # Fallback for unknown status
        return {
            'status': 'unknown',
            'message': 'Status unknown'
        }


""" Attendance serializer"""
class AttendanceListSerializer(serializers.ModelSerializer):
    """
    For list views - shows summary info with shift context.
    Used in dashboard, attendance history, etc.
    """
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    shift_type = serializers.CharField(source='shift.shift_type', read_only=True, allow_null=True)
    is_scheduled = serializers.SerializerMethodField()

    #  Keeping full date time
    clock_in_time = serializers.DateTimeField(read_only=True)
    clock_out_time = serializers.DateTimeField(read_only=True, allow_null=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee_name',
            'clock_in_time',
            'clock_out_time',
            'duration_hours',
            'status',
            'date',
            'shift_type',
            'is_scheduled',
        ]

    def get_is_scheduled(self, obj):
        """Indicates if this was scheduled work or unscheduled"""
        return obj.shift is not None


class AttendanceDetailSerializer(serializers.ModelSerializer):
    """
    For detail views - shows complete info including nested shift and employee.
    Used when viewing single attendance record, clock in/out responses.
    """
    employee = EmployeeProfileSerializer(read_only=True)
    shift = ShiftSerializer(read_only=True, allow_null=True)

    # Calculated fields
    variance_hours = serializers.SerializerMethodField()
    is_late = serializers.SerializerMethodField()
    has_overtime = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee',
            'shift',
            'clock_in_time',
            'clock_out_time',
            'duration_hours',
            'status',
            'date',
            'variance_hours',
            'is_late',
            'has_overtime',
            'created_at',
            'updated_at',
        ]

    def get_variance_hours(self, obj):
        """
        Calculate difference between actual and scheduled hours.
        Positive = overtime, Negative = undertime
        """
        if not obj.shift or not obj.duration_hours:
            return None

        from datetime import datetime, timedelta

        # Calculate scheduled duration
        start = datetime.combine(obj.date, obj.shift.shift_start_time)
        end = datetime.combine(obj.date, obj.shift.shift_end_time)

        if end < start:  # Overnight shift
            end += timedelta(days=1)

        scheduled_hours = (end - start).total_seconds() / 3600
        variance = float(obj.duration_hours) - scheduled_hours

        return round(variance, 2)

    def get_is_late(self, obj):

        """Check if employee clocked in late"""

        if not obj.shift or not obj.clock_in_time:
            return None

        from datetime import datetime

        scheduled_start = datetime.combine(obj.date, obj.shift.shift_start_time)

        # Make timezone aware if needed
        if scheduled_start.tzinfo is None and obj.clock_in_time.tzinfo is not None:
            from django.utils import timezone as tz
            scheduled_start = tz.make_aware(scheduled_start)

        return obj.clock_in_time > scheduled_start

    def get_has_overtime(self, obj):
        """Check if employee worked overtime"""
        if not obj.shift or not obj.clock_out_time:
            return None

        from datetime import datetime

        scheduled_end = datetime.combine(obj.date, obj.shift.shift_end_time)

        # Make timezone aware if needed
        if scheduled_end.tzinfo is None and obj.clock_out_time.tzinfo is not None:
            from django.utils import timezone as tz
            scheduled_end = tz.make_aware(scheduled_end)

        return obj.clock_out_time > scheduled_end


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """
    For creating attendance (clock in).
    Only accepts necessary fields, other fields set by view/model.
    """

    class Meta:
        model = Attendance
        fields = ['employee', 'shift', 'clock_in_time', 'status']
        read_only_fields = ['clock_in_time', 'status']  # Set by view


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    """
    For updating attendance (clock out).
    """

    class Meta:
        model = Attendance
        fields = ['clock_out_time', 'status', 'duration_hours']
        read_only_fields = ['duration_hours']  # Calculated by model


# ============================================
# SUPERVISOR VIEW SERIALIZERS
# ============================================

class AttendanceSupervisorSerializer(serializers.ModelSerializer):
    """
    For supervisor dashboard - shows team attendance with key metrics.
    """
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.id', read_only=True)
    shift_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_report = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee_id',
            'employee_name',
            'clock_in_time',
            'clock_out_time',
            'duration_hours',
            'status',
            'status_display',
            'date',
            'shift_info',
            'has_report',
        ]

    def get_shift_info(self, obj):
        """Return shift info if exists"""
        if obj.shift:
            return {
                'shift_type': obj.shift.shift_type,
                'scheduled_start': obj.shift.shift_start_time,
                'scheduled_end': obj.shift.shift_end_time,
            }
        return None

    def get_has_report(self, obj):
        """Check if report has been submitted for this attendance"""
        return obj.reports.exists()


# ============================================
# DASHBOARD/STATS SERIALIZERS
# ============================================

class AttendanceStatsSerializer(serializers.Serializer):
    """
    For dashboard statistics - not tied to model directly.
    """
    total_hours_today = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_hours_week = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_hours_month = serializers.DecimalField(max_digits=5, decimal_places=2)
    days_present_this_month = serializers.IntegerField()
    average_hours_per_day = serializers.DecimalField(max_digits=5, decimal_places=2)
    late_count_this_month = serializers.IntegerField()
    overtime_hours_this_month = serializers.DecimalField(max_digits=5, decimal_places=2)


# ============================================
# MAIN REPORT SERIALIZERS
# ============================================

class ActivityReportSerializer(serializers.ModelSerializer):
    """
    For list views - summary of reports.
    Used in: report history, dashboard lists.
    """
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    employee_full_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.username', read_only=True, allow_null=True)
    shift_type = serializers.CharField(read_only=True)  # Uses @property from model
    work_date = serializers.DateField(source='attendance.date', read_only=True)

    class Meta:
        model = ActivityReport
        fields = [
            'id',
            'employee_name',
            'employee_full_name',
            'work_date',
            'report_type',
            'shift_type',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'is_approved',
            'approved_by_name',
            'submitted_at',
        ]


class ActivityReportDetailSerializer(serializers.ModelSerializer):
    """
    For detail views - complete report information.
    Used in: viewing single report, after submission, approval review.
    """
    employee = EmployeeProfileSerializer(read_only=True)
    attendance = AttendanceListSerializer(read_only=True)
    approved_by = EmployeeProfileSerializer(read_only=True, allow_null=True)
    shift_type = serializers.CharField(read_only=True)  # Uses @property

    # Computed permission fields
    can_edit = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = ActivityReport
        fields = [
            'id',
            'employee',
            'attendance',
            'report_type',
            'activity_description',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'notes',
            'shift_type',
            'is_approved',
            'approved_by',
            'approved_at',
            'submitted_at',
            'updated_at',
            'can_edit',
            'can_approve',
            'can_delete',
        ]

    def get_can_edit(self, obj):
        """Check if current user can edit this report"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        try:
            user_profile = request.user.employee_profile

            # Can't edit if already approved
            if obj.is_approved:
                return False

            # Employee can edit their own unapproved report
            if obj.employee == user_profile:
                return True

            # Admins can edit any unapproved report
            if user_profile.user_type == 'Admin':
                return True

            return False
        except:
            return False

    def get_can_approve(self, obj):
        """Check if current user can approve this report"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        try:
            user_profile = request.user.employee_profile

            # Already approved
            if obj.is_approved:
                return False

            # Must be supervisor or admin
            if user_profile.user_type not in ['Supervisor', 'Manager', 'Admin']:
                return False

            #  STRICT CHECK: Can only approve direct reports
            if obj.employee.supervisor == user_profile:
                return True

            # Admins can approve any report
            if user_profile.user_type == 'Admin':
                return True

            return False
        except:
            return False

    def get_can_delete(self, obj):
        """Check if current user can delete this report"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        try:
            user_profile = request.user.employee_profile

            # Can't delete approved reports
            if obj.is_approved:
                return False

            # Employee can delete their own unapproved report
            if obj.employee == user_profile:
                return True

            # Admins can delete any unapproved report
            if user_profile.user_type == 'Admin':
                return True

            return False
        except:
            return False


class ActivityReportCreateSerializer(serializers.ModelSerializer):
    """
    For creating reports (employee submitting end-of-shift report).
    Only accepts data needed from user; employee auto-assigned.
    """
    attendance_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ActivityReport
        fields = [
            'attendance_id',
            'report_type',
            'activity_description',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'notes',
        ]

    def validate_attendance_id(self, value):
        """
        Validate that attendance exists, belongs to user, and is eligible for report.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        try:
            employee_profile = request.user.employee_profile
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found")

        # Check attendance exists
        try:
            attendance = Attendance.objects.select_related('shift').get(id=value)
        except Attendance.DoesNotExist:
            raise serializers.ValidationError("Attendance record not found")

        #  Check attendance belongs to this employee
        if attendance.employee != employee_profile:
            raise serializers.ValidationError(
                "You can only submit reports for your own attendance"
            )

        #  Check attendance is clocked out
        if attendance.status != 'clocked_out':
            raise serializers.ValidationError(
                "You must clock out before submitting a report"
            )

        #  Check if report already exists for this attendance
        if ActivityReport.objects.filter(attendance=attendance).exists():
            raise serializers.ValidationError(
                "A report already exists for this attendance period"
            )

        return value

    def validate(self, data):
        """
        Additional validation for report data.
        """
        # Ensure non-negative values
        if data.get('tickets_resolved', 0) < 0:
            raise serializers.ValidationError({'tickets_resolved': 'Cannot be negative'})
        if data.get('calls_made', 0) < 0:
            raise serializers.ValidationError({'calls_made': 'Cannot be negative'})
        if data.get('issues_escalated', 0) < 0:
            raise serializers.ValidationError({'issues_escalated': 'Cannot be negative'})

        # Logical validation: escalations can't exceed tickets
        if data.get('issues_escalated', 0) > data.get('tickets_resolved', 0):
            raise serializers.ValidationError(
                'Issues escalated cannot exceed tickets resolved'
            )

        return data

    def create(self, validated_data):
        """
        Create report with auto-assigned employee.
        """
        request = self.context.get('request')
        employee_profile = request.user.employee_profile

        # Extract and get attendance object
        attendance_id = validated_data.pop('attendance_id')
        attendance = Attendance.objects.get(id=attendance_id)

        #  Create report with proper relationships
        report = ActivityReport.objects.create(
            employee=employee_profile,  # Auto-assign from authenticated user
            attendance=attendance,
            **validated_data
        )

        return report


class ActivityReportUpdateSerializer(serializers.ModelSerializer):
    """
    For updating reports (employee editing before approval).
    Only allows editing work metrics and descriptions.
    """

    class Meta:
        model = ActivityReport
        fields = [
            'activity_description',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'notes',
        ]

    def validate(self, data):
        """
        Validate that report can be edited.
        """
        request = self.context.get('request')
        instance = self.instance

        try:
            user_profile = request.user.employee_profile
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found")

        #  Can't edit if already approved
        if instance.is_approved:
            raise serializers.ValidationError("Cannot edit an approved report")

        #  Only the report creator can edit (unless admin)
        if instance.employee != user_profile:
            if user_profile.user_type != 'Admin':
                raise serializers.ValidationError("You can only edit your own reports")

        # Validate non-negative values
        if data.get('tickets_resolved', instance.tickets_resolved) < 0:
            raise serializers.ValidationError({'tickets_resolved': 'Cannot be negative'})
        if data.get('calls_made', instance.calls_made) < 0:
            raise serializers.ValidationError({'calls_made': 'Cannot be negative'})
        if data.get('issues_escalated', instance.issues_escalated) < 0:
            raise serializers.ValidationError({'issues_escalated': 'Cannot be negative'})

        return data


class ActivityReportApprovalSerializer(serializers.ModelSerializer):
    """
    For supervisors approving reports.
    Minimal fields, strict validation.
    """

    class Meta:
        model = ActivityReport
        fields = ['is_approved']

    def validate(self, data):
        """
        Validate that current user can approve this report.
         STRICT SUPERVISOR HIERARCHY CHECK
        """
        request = self.context.get('request')
        report = self.instance

        try:
            current_supervisor = request.user.employee_profile
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found")

        #  Must be supervisor, manager, or admin
        if current_supervisor.user_type not in ['Supervisor', 'Manager', 'Admin']:
            raise serializers.ValidationError(
                "Only supervisors can approve reports"
            )

        #  Already approved?
        if report.is_approved:
            raise serializers.ValidationError("Report is already approved")

        #  STRICT CHECK: Must supervise this employee (unless admin)
        report_employee = report.employee
        employee_supervisor = report_employee.supervisor

        if employee_supervisor != current_supervisor:
            if current_supervisor.user_type != 'Admin':
                raise serializers.ValidationError(
                    f"You can only approve reports for your direct reports. "
                    f"This report belongs to {report_employee.user.username}, "
                    f"whose supervisor is {employee_supervisor.user.username if employee_supervisor else 'None'}"
                )

        return data

    def update(self, instance, validated_data):
        """
        Approve the report and record approval metadata.
        """
        request = self.context.get('request')
        supervisor_profile = request.user.employee_profile

        #  Set approval fields
        instance.is_approved = True
        instance.approved_by = supervisor_profile
        instance.approved_at = timezone.now()
        instance.save()

        return instance


# ============================================
# SUPERVISOR-SPECIFIC SERIALIZERS
# ============================================

class PendingReportSerializer(serializers.ModelSerializer):
    """
    For supervisor's pending approvals view.
    Optimized to show only what's needed for approval decisions.
    """
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_username = serializers.CharField(source='employee.user.username', read_only=True)
    employee_id = serializers.IntegerField(source='employee.id', read_only=True)

    shift_date = serializers.DateField(source='attendance.date', read_only=True)
    work_duration = serializers.DecimalField(
        source='attendance.duration_hours',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    shift_type = serializers.CharField(read_only=True)  # Uses @property

    # Quick summary
    total_work = serializers.SerializerMethodField()

    class Meta:
        model = ActivityReport
        fields = [
            'id',
            'employee_id',
            'employee_name',
            'employee_username',
            'shift_date',
            'shift_type',
            'work_duration',
            'report_type',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'total_work',
            'activity_description',
            'notes',
            'submitted_at',
        ]

    def get_total_work(self, obj):
        """Quick summary of work done"""
        return {
            'tickets': obj.tickets_resolved,
            'calls': obj.calls_made,
            'escalations': obj.issues_escalated,
        }


class TeamReportSummarySerializer(serializers.ModelSerializer):
    """
    For supervisor dashboard - team overview.
    Shows high-level stats per employee.
    """
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_username = serializers.CharField(source='employee.user.username', read_only=True)
    shift_type = serializers.CharField(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = ActivityReport
        fields = [
            'id',
            'employee_name',
            'employee_username',
            'shift_type',
            'tickets_resolved',
            'calls_made',
            'status',
            'submitted_at',
        ]

    def get_status(self, obj):
        """Report approval status"""
        if obj.is_approved:
            return 'Approved'
        return 'Pending'


class ApprovedReportSerializer(serializers.ModelSerializer):
    """
    For viewing approved reports (history, analytics).
    """
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.username', read_only=True)
    shift_date = serializers.DateField(source='attendance.date', read_only=True)
    shift_type = serializers.CharField(read_only=True)

    class Meta:
        model = ActivityReport
        fields = [
            'id',
            'employee_name',
            'shift_date',
            'shift_type',
            'tickets_resolved',
            'calls_made',
            'issues_escalated',
            'approved_by_name',
            'approved_at',
            'submitted_at',
        ]

# ============================================


# STATS/ANALYTICS SERIALIZERS
# ============================================

class EmployeeReportStatsSerializer(serializers.Serializer):
    """
    Employee's personal report statistics.
    Not tied to model directly.
    """
    total_reports = serializers.IntegerField()
    approved_reports = serializers.IntegerField()
    pending_reports = serializers.IntegerField()
    total_tickets_resolved = serializers.IntegerField()
    total_calls_made = serializers.IntegerField()
    total_escalations = serializers.IntegerField()
    average_tickets_per_shift = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_week_reports = serializers.IntegerField()
    this_month_reports = serializers.IntegerField()


class TeamReportStatsSerializer(serializers.Serializer):
    """
    Supervisor's team statistics.
    """
    total_team_members = serializers.IntegerField()
    reports_today = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    approved_today = serializers.IntegerField()
    total_tickets_today = serializers.IntegerField()
    total_calls_today = serializers.IntegerField()
    top_performer_today = serializers.DictField()
    approval_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
