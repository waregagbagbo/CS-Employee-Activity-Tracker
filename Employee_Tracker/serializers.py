from rest_framework import serializers
from accounts.models import EmployeeProfile,Department
from .models import Shift,ActivityReport,WebHook,WebHookLog

#create the serializers for the models
class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
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

class WebHookSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = WebHook
        fields = '__all__'
        depth = 1

class WebHookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebHookLog
        fields = '__all__'
 


