import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites import requests
from django.dispatch import receiver
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from accounts.models import Employee, Department
from Employee_Tracker.models import Shift
import requests

# use logging from logs
logger = logging.getLogger(__name__)

# use the AUTH USER model as an object instead of str
User = get_user_model()

# webhook url
webhook_url = ' https://webhook.site/924a9fa3-98cd-418f-9689-15fbdcb644c7'

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
def create_shift_trigger(sender, instance, created, **kwargs):
    if created: # only for updates
        data ={
            "STATUS": f'🚨 Shift Update!',
            'id': instance.id,
            'shift_agent': instance.shift_agent,
            'shift_status': instance.shift_status,
            'shift_type': instance.shift_type,
            'shift_start_time': instance.shift_start_time,
            'shift_updated_at': instance.shift_updated_at,
        }
    #add your webhook url
    try:
        response = requests.post(webhook_url, data)
        # raise status upon trigger
        response.raise_for_status()
        logger.info(f'Webhook updated successfully{response.json()}')
    except requests.exceptions.RequestException as e:
        print(f'Webhook failed to post. {e}')