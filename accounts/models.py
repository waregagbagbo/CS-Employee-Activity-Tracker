from django.db import models
from django.contrib.auth.models import AbstractUser

USER_TYPE =[
    ('supervisor', 'Supervisor'),
    ('employee_agent', 'Employee Agent'),
    ('admin', 'Admin'),
]

# Create your models here.
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)


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
    title = models.CharField(max_length=100,default=1)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        db_table = 'Department'
        ordering = ['title']


class Employee(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE,related_name='employee_profile')
    hire_date = models.DateField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    department = models.ForeignKey('Department', on_delete=models.CASCADE, blank=True, null=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE, default='employee_agent')
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL,null=True,blank=True,related_name='supervised_employee')


    def __str__(self):
        return f"{self.user.username}, {self.department}, {self.user_type}"

    # let us expose the username by using @property decorator to access it directly
    @property
    def username(self):
        return self.user.username

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['user__id']
        unique_together = (('user', 'department'),) # a user cannot belong to the same department twice



