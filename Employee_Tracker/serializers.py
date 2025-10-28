from datetime import datetime,timedelta
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from accounts.models import Employee,Department
from .models import Shift,ActivityReport
from django.utils import timezone


#create the serializers for the models
class DepartmentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        extra_kwargs = {
            "url": {"view_name": "department-detail", "lookup_field": "pk"}
        }


# Profile setup serializer
class EmployeeProfileSerializer(serializers.HyperlinkedModelSerializer):
    department = DepartmentSerializer(read_only=True)
    user = serializers.HyperlinkedRelatedField(read_only=True, view_name='employee-detail', lookup_field='pk')

    # user = serializers.PrimaryKeyRelatedField(read_only=True) # suitable with ModelSerializer

    class Meta:
        model = Employee
        fields = '__all__'
        #read_only_fields = ( 'user',)


# shifts serializer
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
        try:
            employee_profile = Employee.objects.get(user=user)
        except ObjectDoesNotExist:
            raise serializers.ValidationError('Employee does not exist')
        #if not user.groups.filter(name__in=['Supervisor','Admin']).exists():
        #if not user.groups.filter(name__iregex=r'^(Supervisor|Admin)$').exists():

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


    # run full update
    """def update(self, instance, validated_data):
        # create a user instance
        user = self.context['request'].user
        try:
            employee_profile = Employee.objects.get(user=user)
        except ObjectDoesNotExist:
            raise serializers.ValidationError('Employee does not exist')

        # check for the validations
        if validated_data.get('is_approved') or validated_data.get('activity_approved_at',False):
            if not employee_profile.user_type not in ['Supervisor','Admin']:
                raise serializers.ValidationError('Only supervisor or Managers can approve')

            # auto assign supervisors during approval
            if employee_profile.user_type == 'Supervisor':
                instance.supervisor = employee_profile

            # This line assigns shift agent for traceability
            if employee_profile.user_type == 'Employee':
                instance.shift_active_agent = employee_profile
            # Update other fields normally
        return super().update(instance, validated_data)"""



