from django.contrib.auth import get_user_model
from django.contrib.sites import requests
from django.dispatch import receiver
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from accounts.models import Employee, Department
from Employee_Tracker.models import Shift

User = get_user_model()

# handle auto token generation
@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
       Token.objects.create(user=instance)

# handle auto profile creation
@receiver(post_save, sender=User)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created and not hasattr(instance, 'employee_profile'): # ensures handling duplicates
        assign_dept, _= Department.objects.get_or_create(title='Tech')
        Employee.objects.create(user=instance, department=assign_dept)
        print(f'Profile created! for {instance.email}')



# create signal to fire up shift changes
@receiver(post_save, sender=Shift)
def create_shift_trigger(sender, instance=None, created=False, **kwargs):
    if created:
        payload ={
            'id': instance.id,
            'shift_agent': instance.shift_agent,
            'shift_status': instance.shift_status,
            'shift_type': instance.shift_type,
            'shift_start_time': instance.shift_start_time,
            'shift_updated_at': instance.shift_updated_at,
        }
    #add your webhook url
    webhook_url = ' https://webhook.site/924a9fa3-98cd-418f-9689-15fbdcb644c7'
    try:
        response = requests.post(webhook_url, json=payload)
        return response
    except requests.exceptions.RequestException as e:
        print(f'Webhook failed to post. {e}')



