from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift, ActivityReport, Attendance,StaticShift
from django.utils import timezone


#create the serializers for the models
class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    head_node = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'title','description','head_node','employee_count']

    # custom user field
    def get_head_node(self, obj):
        return obj.head_node.username


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
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Employee

        # apply nested serializer on the fields for customization on the frontend
        fields = ['id', 'username', 'email', 'first_name', 'last_name','full_name','department','hire_date','bio','user_type','is_active']

    # create fullname
    def get_full_name(self,obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class StaticShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticShift
        fields = ['id', 'name', 'shift_type', 'start_time', 'end_time']
        #fields = "__all__"



class ShiftSerializer(serializers.ModelSerializer):
    """
    React-friendly shift serializer with attendance status.
    """
    shift_agent = EmployeeProfileSerializer(read_only=True)
    static_shift = StaticShiftSerializer(read_only=True)

    class Meta:
        model = Shift
        fields = ['id',
                  'shift_agent',
                  'shift_date',
                  'shift_status',
                  'shift_created_at',
                  'created_by',
                  'shift_updated_at',
                  'static_shift',
        ]

""" Attendance serializer"""
class AttendanceListSerializer(serializers.ModelSerializer):
    """
    For list views - shows summary info with shift context.
    Used in dashboard, attendance history, etc.    """

    shift_info = ShiftSerializer(source='shift_attendance', read_only=True)
    duration_hours = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    validation_error = serializers.CharField(read_only=True)
    validation_message = serializers.CharField(read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'shift_attendance', 'shift_info', 'clock_in_time', 'clock_out_time', 'status', 'duration_hours',
                  'validation_error', 'validation_message']

    def create(self, validated_data):
        # Auto-set employee to logged-in user
        validated_data['employee'] = self.context['request'].user.employee
        return super().create(validated_data)

    def get_is_scheduled(self, obj):
        """Indicates if this was scheduled work or unscheduled"""
        return obj.date is not None


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
                'shift_attendance_type': obj.shift.shift_type,
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

class ActivityReportEmployeeSerializer(serializers.ModelSerializer):
    """
    For list views - summary of reports.
    Used in: report history, dashboard lists.
    """
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    shift_type = serializers.CharField(read_only=True)
    shift = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ActivityReport
        fields = [
            'id', 'employee', 'employee_name', 'attendance',
            'shift_activity_type', 'report_type', 'activity_description',
            'tickets_resolved', 'calls_made', 'issues_escalated', 'notes',
            'activity_submitted_at', 'shift_type', 'shift', 'created_at', 'updated_at'
        ]
        #read_only_fields = fields

    def get_shift(self, obj):
        if obj.shift:
            return {
                'id': obj.shift.id,
                'date': obj.shift.shift_date,
                'shift_type': obj.shift.static_shift.name if obj.shift.static_shift else 'N/A'
            }
        return None

    def get_supervisor(self, obj):
        if obj.supervisor:
            return {
                'id': obj.supervisor.id,
                'name': obj.supervisor.user.get_full_name() if obj.supervisor.user else 'N/A'
            }
        return None


class ActivityReportSupervisorSerializer(serializers.ModelSerializer):
    """Serializer for supervisors - shows all fields including approval"""
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.get_full_name', read_only=True)
    shift_type = serializers.CharField(read_only=True)
    shift = serializers.SerializerMethodField(read_only=True)
    supervisor = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ActivityReport
        fields = [
            'id', 'employee', 'employee_name', 'attendance', 'approved_by', 'approved_by_name',
            'shift_activity_type', 'report_type', 'activity_description',
            'tickets_resolved', 'calls_made', 'issues_escalated', 'notes',
            'activity_submitted_at', 'is_approved', 'activity_approved_at',
            'shift_type', 'shift', 'supervisor', 'created_at', 'updated_at'
        ]
        read_only_fields = ['employee','shift_type', 'supervisor', 'created_at', 'updated_at']

    def get_shift(self, obj):
        if obj.shift:
            return {
                'id': obj.shift.id,
                'date': obj.shift.shift_date,
                'shift_type': obj.shift.static_shift.name if obj.shift.static_shift else 'N/A'
            }
        return None

    def get_supervisor(self, obj):
        if obj.supervisor:
            return {
                'id': obj.supervisor.id,
                'name': obj.supervisor.user.get_full_name() if obj.supervisor.user else 'N/A'
            }
        return None


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
