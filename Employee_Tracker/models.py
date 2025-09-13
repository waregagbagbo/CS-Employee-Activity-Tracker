from datetime import datetime
from django.db import models
from django.forms import JSONField
from accounts.models import CustomUser,Employee

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
]

REPORT_TYPES = [
    ('End_of_Shift','End_of_Shift'),
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
    shift_agent = models.ForeignKey(Employee, on_delete=models.CASCADE)
    shift_date = models.DateField(auto_now=False, blank=False)
    shift_start_time = models.TimeField(auto_now=False,blank=False)
    shift_end_time = models.TimeField(auto_now=False, blank=False)
    shift_updated_at = models.DateTimeField(auto_now=True)
    shift_type = models.CharField(max_length=50, choices=SHIFT_TYPES, default='Day_Shift', blank=False)
    shift_status = models.CharField(max_length=50, choices=STATUS, default='Scheduled',blank = False)

    def __str__(self):
        return str(self.shift_agent)

    class Meta:
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'
        ordering = ['shift_agent', 'shift_date']

#create activity model class
class ActivityReport(models.Model):
    shift_active_agent = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shift_active_agent')
    supervisor = models.ForeignKey(Employee, on_delete=models.CASCADE)
    shift_activity_type = models.CharField(max_length=50, choices=SHIFT_TYPES, default='Night_Shift')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES, default='other')
    activity_description = models.TextField()
    tickets_resolved = models.IntegerField(default=0)
    calls_made = models.IntegerField(default=0)
    issues_escalated = models.IntegerField(default=0)
    notes = models.TextField()
    activity_submitted_at = models.DateTimeField(auto_now=False, blank=False)
    is_approved = models.BooleanField(default=False)
    activity_approved_at = models.DateTimeField(auto_now=False, default=datetime.now)

    def __str__(self):
        return self.report_type

    class Meta:
        verbose_name = 'Activity Report'
        verbose_name_plural = 'Activity Reports'
        ordering = ['report_type', 'shift_activity_type']


# webhook model
class WebHook(models.Model):
    webhook_name = models.CharField(max_length=100)
    webhook_url = models.URLField(max_length=200, unique=True)
    webhook_created_by = models.ForeignKey(Employee, on_delete=models.CASCADE)
    webhook_event_types = models.JSONField(default=event)
    secret_key = models.TextField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.webhook_name

    class Meta:
        verbose_name_plural = 'WebHooks'
        unique_together = (('webhook_name', 'webhook_url'),)


class WebHookLog(models.Model):
    webhook_config = models.ForeignKey(WebHook, on_delete=models.CASCADE)
    event_types = models.JSONField(default=event)
    response_status = models.CharField(max_length=10, choices=STATUS, default='Scheduled')
    timestamp = models.DateTimeField(auto_now_add=True)
    response_body = models.JSONField()

    def __str__(self):
        return self.response_status

    class Meta:
        verbose_name_plural = 'WebHook Logs'
        unique_together = (('webhook_config', 'event_types'),)








