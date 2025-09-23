from datetime import datetime
from django.db import models
from django.forms import JSONField
from accounts.models import CustomUser,Employee
from .dispatcher import webhook_dispatcher
from .registry import EVENTS

# Create your models here.
STATUS = [
    ('Signed_In', 'Signed_In'),
    ('Shift_Started','Shift_Started'),
    ('Shift_Completed','Shift_Completed')
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
    shift_updated_at = models.DateTimeField(auto_now=True) #    records the time at which the shift was last updated
    shift_type = models.CharField(max_length=50, choices=SHIFT_TYPES, default='Day_Shift', blank=False)
    shift_status = models.CharField(max_length=50, choices=STATUS, default='Signed_In',blank = False)

    def __str__(self):
        return str(self.shift_agent)

    class Meta:
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'
        ordering = ['shift_agent', 'shift_date']

    # logic to trigger the webhook
    def save(self, *args, **kwargs):
        if self.pk:
            shift_previous_status = Shift.objects.get(pk=self.pk).shift_status
            new_status_recorded = shift_previous_status != self.shift_status
        else:
            new_status_recorded = False
            shift_previous_status = self.shift_status
            return super().save

        if new_status_recorded:
            self.shift_previous_status = shift_previous_status  # attach for formatter
            event = EVENTS.get('shift_status_changed')
            if event:
                payload = event['formatter'](self)
                webhook_dispatcher('shift_status_changed', payload, event['destination'])


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
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['report_type', 'shift_activity_type']


# webhook model
"""class WebHook(models.Model):
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
        unique_together = (('webhook_config', 'event_types'),)"""








