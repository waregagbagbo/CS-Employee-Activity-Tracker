from datetime import datetime,timedelta
from django.core.exceptions import ObjectDoesNotExist
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
    hire_date = serializers.DateField(read_only=True) # value from the model
    bio = serializers.CharField() # for posts
    user_type = serializers.CharField(read_only=True)


    class Meta:
        model = Employee
        #fields = '__all__'

        # apply nested serializer for the fields for customization on the frontend
        fields = ['id', 'username', 'email', 'first_name', 'last_name','department','hire_date','bio','user_type']


# shifts serializer
class ShiftSerializer(serializers.ModelSerializer):
    shift_url = serializers.HyperlinkedIdentityField(read_only=True,view_name='shift-detail', lookup_field='pk')
    shift_agent = EmployeeProfileSerializer(read_only=True)
    shift_timer_count = serializers.SerializerMethodField() # custom method to handle hours worked

    class Meta:
        model = Shift
        fields = ('id','shift_url','shift_agent','shift_date','shift_start_time','shift_end_time',
                  'shift_type','shift_status','shift_timer_count',)


   #custom serializer method
    def get_shift_timer_count(self, obj):
        if obj.shift_start_time and obj.shift_end_time:
            today = timezone.localdate()
            start_dt = timezone.make_aware(datetime.combine(today, obj.shift_start_time))
            end_dt = timezone.make_aware(datetime.combine(today, obj.shift_end_time))

            # Handle overnight shift
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)

            duration = (end_dt - start_dt).total_seconds() / 3600
            if duration >= 8 and not 'shift_status' == "Scheduled":
                return 'Good work, shift done for today'
            else:
                return f'Shift incomplete ({round(duration, 2)} hours logged)'

        elif obj.shift_start_time and not obj.shift_end_time:
            now = timezone.now()
            today = timezone.localdate()
            start_dt = timezone.make_aware(datetime.combine(today, obj.shift_start_time))

            # Handle overnight shift in progress
            if now <= start_dt:
                now += timedelta(days=1)

            duration = (now - start_dt).total_seconds() / 3600
            return f'Shift in progress ({round(duration, 2)} hours so far)'

        else:
            return 'Shift not started'


class ActivityReportSerializer(serializers.ModelSerializer):
    shift_active_agent = EmployeeProfileSerializer(read_only=True)
    supervisor = EmployeeProfileSerializer(read_only=True)
    report_id = serializers.HyperlinkedRelatedField(read_only=True, view_name='activityreport-detail', lookup_field='pk')
    class Meta:
        model = ActivityReport
        fields = '__all__'

    # hide is_approved field to non supervisor/admin
    def get_fields(self):
        fields = super().get_fields()
        user = self.context['request'].user
        try:
            employee_profile = Employee.objects.get(user=user)
        except ObjectDoesNotExist:
            raise serializers.ValidationError('Employee does not exist')

        if employee_profile.user_type not in ['Supervisor','Admin']:
            fields.pop('is_approved',None)
            fields.pop('activity_approved_at',None)
        return fields

    def create(self,validated_data):
        user = self.context['request'].user
        #fetch employee profile
        try:
            employee_profile = Employee.objects.get(user=user)
        except ObjectDoesNotExist:
            raise serializers.ValidationError('Employee does not exist')

        # Always assign the active agent
        validated_data['shift_active_agent'] = employee_profile

        # Auto-attach the supervisor if the agent has one
        if hasattr(employee_profile, 'supervisor') and employee_profile.supervisor:
            validated_data['supervisor'] = employee_profile.supervisor

        # restrict is_approved unless is supervisor
        if validated_data.get('is_approved') or validated_data.get('activity_approved_at',False):
            if employee_profile.user_type not in ['Supervisor','Admin']:
                raise serializers.ValidationError('Only supervisor or Admins can approve')
            # auto assign supervisor
            validated_data['supervisor'] = employee_profile
        return super().create(validated_data)

    # run partial update
    def update(self,instance,validated_data):
        user = self.context['request'].user
        try:
            employee_profile = instance.shift_active_agent
        except ObjectDoesNotExist:
            raise serializers.ValidationError('Employee does not exist')
        # check for validations
        if validated_data.get('is_approved') or validated_data.get('activity_approved_at',False):
            if not employee_profile.user_type not in ['Supervisor','Admin']:
                raise serializers.ValidationError('Only supervisor or Managers can approve')
        print('Data saved successfully')
        return super().update(instance,validated_data)


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


