from datetime import datetime,timedelta
from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift,ActivityReport,WebHook,WebHookLog
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


class ShiftSerializer(serializers.ModelSerializer):
    shift_agent = EmployeeProfileSerializer(read_only=True)
    #shift_agent_id = EmployeeProfileSerializer(write_only=True)
    shift_timer_count = serializers.SerializerMethodField() # custom method to handle hours worked

    class Meta:
        model = Shift
        fields = ('shift_agent','shift_date','shift_start_time','shift_end_time','shift_agent',
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
            if duration >= 8:
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
    class Meta:
        model = ActivityReport
        fields = '__all__'

class WebHookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebHook
        fields = '__all__'

class WebHookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebHookLog
        fields = '__all__'



