from django.dispatch import receiver
from django.conf import settings
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from accounts.models import Employee

# handle auto token generation
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

# handle auto profile creation
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created and not hasattr(instance, 'employee profile'): # ensures handling duplicates
        Employee.objects.create(user=instance)
        print('Profile created!'.format(user=instance))


