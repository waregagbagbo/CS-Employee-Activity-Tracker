from django.dispatch import receiver
from django.conf import settings
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from accounts.models import Employee, Department

# handle auto token generation
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
       Token.objects.create(user=instance)

# handle auto profile creation
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created and not hasattr(instance, 'employee_profile'): # ensures handling duplicates
        assign_dept, _= Department.objects.get_or_create(name='Tech')
        Employee.objects.create(user=instance, department=assign_dept)
        print('Profile created!'.format(user=instance))


