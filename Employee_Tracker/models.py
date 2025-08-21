from django.db import models
from django.forms import JSONField

from accounts.models import CustomUser,EmployeeProfile

# Create your models here.
STATUS = [
    ('Scheduled', 'Scheduled'),
    ('Active', 'Active'),
    ('Completed', 'Completed'),
    ('Missed', 'Missed'),
    ('Scheduled', 'Scheduled'),
]

SHIFT_TYPES = [
    ('Day_Shift','Day_Shift'),
    ('Late','Late_Shift'),
    ('Recon_Shift','Recon_Shift'),
    ('Night_Shift','Night_Shift'),
    ('R_Shift','R_Shift'),
]

REPORT_TYPES = [
    ('End_of_Shift','End_of_Shift'),
    ('Lunch','Lunch'),
    ('Emergency','Emergency'),
    ('Break','Break'),
    ('Other','Other'),
]

"""define callable for JSONField Dict"""
def event():
    return{
        'shift_started':'shift_started',
        'shift_completed':'shift_completed',
        'shift_type':'shift_type',
        'report_type':'report_type',
        'report_submitted':'report_submitted',
    }

#create shift class
class Shift(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True, auto_now=False)
    start_time = models.TimeField(auto_now_add=True, auto_now=False)
    end_time = models.TimeField(auto_now_add=True, auto_now=False)
    updated_at = models.DateTimeField(auto_now=True)
    shift_type = models.CharField(max_length=10, choices=SHIFT_TYPES, default='R_Shift')
    shift_status = models.CharField(max_length=10, choices=STATUS, default='Scheduled')


#create activity model class
class ActivityReport(models.Model):
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    report_type = models.CharField(max_length=10, choices=REPORT_TYPES, default='other')
    title = models.CharField(max_length=100)
    description = models.TextField()
    tickets_resolved = models.IntegerField(default=0)
    calls_made = models.IntegerField(default=0)
    issues_escalated = models.IntegerField(default=0)
    notes = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

    class Meta:
        model = 'ActivityReport'
        verbose_name = 'Activity Report'
        verbose_name_plural = 'Activity Reports'


# webhook model
class WebHook(models.Model):
    name = models.CharField(max_length=100)
    web_url = models.URLField(max_length=200, unique=True)
    created_by = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    event_types = models.JSONField(default=event)
    secret_key = models.TextField()
    is_active = models.BooleanField(default=True)



