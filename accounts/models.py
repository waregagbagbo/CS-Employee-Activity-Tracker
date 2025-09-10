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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'username',
    ]

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'Users'


class Department(models.Model):
    title = models.CharField(max_length=100,default='Tech')

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        db_table = 'Department'
        ordering = ['title']


class Employee(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE,related_name='employee_profile')
    department = models.ForeignKey('Department', on_delete=models.CASCADE, blank=True, null=True)
    shift_start_time = models.DateTimeField()
    shift_end_time = models.DateTimeField()
    user_type = models.CharField(max_length=20, choices=USER_TYPE, default='Employee_Agent')
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL,null=True,blank=True,related_name='supervised_employee')

    def __str__(self):
        return f"{self.user.username}, {self.department}"

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        #db_table = 'employee_profile'
        ordering = ['user__id']
        permissions = (
            ('can_create_report','create reports'),
            ('can_view_report','view reports'),
            ('can_update_report','update reports'),
            ('can_delete_report','delete reports'),
            ('can_add_users','add users'),
            ('can_modify_users','modify users'),
        )


