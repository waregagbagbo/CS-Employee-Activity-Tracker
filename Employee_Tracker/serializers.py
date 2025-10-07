from datetime import datetime,timedelta
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift,ActivityReport
from django.utils import timezone


#create the serializers for the models
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class EmployeeProfileSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    class Meta:
        model = Employee
        fields = '__all__'

    # add update logic
    """def update(self, instance, validated_data):
        instance.hire_date = validated_data.get('hire_date', instance.hire_date)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.department = validated_data.get('department', instance.department)
        instance.user_type = validated_data.get('user_type', instance.user_type)
        instance.supervisor = validated_data.get('supervisor', instance.supervisor)
        instance.save()
        return instance"""

class ShiftSerializer(serializers.ModelSerializer):
    shift_agent = EmployeeProfileSerializer(read_only=True)
    shift_timer_count = serializers.SerializerMethodField() # custom method to handle hours worked

    class Meta:
        model = Shift
        fields = ('shift_agent','shift_date','shift_start_time','shift_end_time',
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
    class Meta:
        model = ActivityReport
        fields = '__all__'

    # hide is_approved field to non supervisor/admin
    def get_fields(self):
        fields = super().get_fields()
        user = self.context['request'].user
        if not user.groups.filter(name__in=['Supervisor','Admin']).exists():
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

        # restrict is_approved unless is supervisor
        if validated_data.get('is_approved','activity_approved_at', False):
            if not user.groups.filter(name__in=['Supervisor','Admin']).exists():
                raise serializers.ValidationError('Only supervisor or Managers can approve')

            # auto assign shift agent or supervisor
            validated_data['shift_active_agent'] = employee_profile
            if user.groups.filter(name__in=['Supervisor','Admin']).exists():
                validated_data['Supervisor'] = employee_profile
            return super().create(validated_data)
        return validated_data




