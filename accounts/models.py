from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser

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
        db_table = 'CustomUser'
        ordering = ['email']


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
    employee_id = models.IntegerField(unique=True)
    department = models.ForeignKey('Department', on_delete=models.CASCADE)
    shift_start_time = models.DateTimeField(auto_now_add=True)
    shift_end_time = models.DateTimeField(auto_now_add=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE, default='Employee_Agent')
    supervisor = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='supervised_employees')

    def __str__(self):
        return f"{self.user.username} - {self.employee_id}"

    class Meta:
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
        db_table = 'EmployeeProfile'
        ordering = ['employee_id']
        unique_together = (('employee_id', 'department'),)
        

