from datetime import datetime

from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift,ActivityReport,WebHook,WebHookLog

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
    shift_timer_count = serializers.SerializerMethodField() # custom method to handle hours worked

    class Meta:
        model = Shift
        fields = ('shift_agent','shift_date','shift_start_time','shift_end_time','shift_agent',
                  'shift_type','shift_status','shift_timer_count',)


  # custom serializer method
    def get_shift_timer_count(self,obj):
        if obj.shift_start_time and obj.shift_end_time:
            duration = (obj.shift_end_time - obj.shift_start_time).total_seconds()/3600
            if duration >= 8:
                return 'Good work, shift done for today'
            else:
                return 'Shift not yet completed, continue working'

        elif obj.shift_start_time and not obj.shift_end_time:
            duration = (datetime.now(obj.shift_end_time.tzinfo) - obj.shift_start_time).total_seconds()/3600
            return f'Shift in progress(round{round(duration,2)}hours so far)'

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



