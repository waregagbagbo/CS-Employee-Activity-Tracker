from datetime import datetime
from django.db import models
from django.forms import JSONField
from accounts.models import CustomUser,Employee
#from .dispatcher import webhook_dispatcher
from .registry import EVENTS
#from .webhook_email import shift_email_trigger

# Create your models here.
STATUS = [
    ('Shift_Started','Shift_Started'),
    ('Shift_Completed','Shift_Completed'),
    ('In_Progress','In_Progress'),
]

ATTENDANCE_TYPES = [
    ('Clocked_In','Clocked_In'),
    ('Clocked_Out','Clocked_Out'),
    ('Break','Break_In'),
]

SHIFT_TYPES = [
    ('Day_Shift','Day_Shift'),
    ('Late_Shift','Late_Shift'),
    ('Recon_Shift','RS_Shift'),
    ('Night_Shift','Night_shift'),
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
        unique_together = (('shift_agent', 'shift_date'),)


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
        unique_together = (('report_type', 'shift_active_agent'),)


# Model for attendance tracking
class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    clock_in_time = models.DateTimeField()
    clock_out_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-clock_in_time']
