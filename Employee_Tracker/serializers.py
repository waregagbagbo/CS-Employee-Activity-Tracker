from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift,ActivityReport,WebHook,WebHookLog

#create the serializers for the models
class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
        depth = 1

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        depth = 1

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'
        depth = 1

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



