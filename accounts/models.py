from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser

from Cs_Tracker.settings import AUTH_USER_MODEL

USER_TYPE =[
    ('Supervisor', 'Supervisor'),
    ('Employee_Agent', 'Employee_Agent'),
    ('Admin', 'Admin'),
]

# Create your models here.
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, default="test@gmail.com")
    hire_date = models.DateField(null=True, blank=True)
    bio = models.TextField()
    avatar = models.ImageField(upload_to='avatars/')

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

class Department(models.Model):
    title = models.CharField(max_length=100)
    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        db_table = 'Department'
        ordering = ['title']



class EmployeeProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    department = models.ForeignKey('Department', on_delete=models.CASCADE)
    shift_start_time = models.DateTimeField(auto_now_add=True)
    shift_end_time = models.DateTimeField(auto_now_add=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE, default='Employee_Agent')
    supervisor = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='supervised_employees')

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
        db_table = 'employee_profile'
        ordering = ['user_id']
        unique_together = (('supervisor', 'department'),)
        permissions = (
            'can_add_users', 'can_change_users', 'can_delete_users',
            'can_update_shifts', 'can_view_shifts','can_delete_shifts',
            'can_update_reports', 'can_view_reports','can_delete_reports',
            'can_update_webhook', 'can_delete_webhook',
        )


