from datetime import datetime, timedelta
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from accounts.models import Employee
from datetime import datetime, time

#from .dispatcher import webhook_dispatcher
from .registry import EVENTS
#from .webhook_email import shift_email_trigger

# Create your models here.
SHIFT_STATUS = [
    ('shift_completed','Shift_Completed'), # shift completed
    ('shift_in_progress',"Shift_In_Progress"), # shift started
    ('shift_scheduled','Shift_Scheduled'), # shift scheduled
    ('no_show','No_Show'), # agent did not show up
]

ATTENDANCE_TYPES = [
    ('clocked_in','Clocked_In'),
    ('clocked_out','Clocked_Out'),
    ('on_break','Break'),
]

SHIFT_TYPES = [
    ('day_shift','Day_Shift'),
    ('late_shift','Late_Shift'),
    ('recon_shift','RS_Shift'),
    ('night_shift','Night_shift'),
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

"""create reusable static shift template,defined once"""
class StaticShift(models.Model):
    name = models.CharField(max_length=50, blank=False, unique=True) # day, afternoon
    shift_type = models.CharField(max_length=50, choices=SHIFT_TYPES, default='day_shift', blank=False)
    start_time = models.TimeField(db_index=True) # explicit
    end_time = models.TimeField()  # explicit via default

    def get_shift_duration_hours(self):
        """Calculate duration in hours between start_time and end_time"""
        # Convert time objects to datetime for calculation
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)

        # Handle shifts that cross midnight
        if end < start:
            end = datetime.combine(datetime.today() + timedelta(days=1), self.end_time)

        duration = end - start
        return round(duration.total_seconds() / 3600, 2)

    def __str__(self):
        return f"{self.name} - {self.start_time} - {self.end_time}"

    class Meta:
        verbose_name = 'Defaults'
        verbose_name_plural = 'Defaults'
        ordering = ['start_time', 'end_time']


""" create shift class """
class Shift(models.Model):
    shift_agent = models.ForeignKey(Employee, on_delete=models.CASCADE,blank=False, related_name='employee_profile')
    shift_date = models.DateField(auto_now=False, blank=False)

    static_shift = models.ForeignKey(StaticShift, on_delete=models.PROTECT, null=True, related_name='shift_instances')
    shift_status = models.CharField(max_length=50, choices=SHIFT_STATUS, default='no_show',blank = False)

    shift_created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    shift_updated_at = models.DateTimeField(auto_now=True) # records the time at which the shift was last updated

    # Properties to access data from StaticShift
    @property
    def shift_type(self):
        return self.static_shift.shift_type

    @property
    def shift_start_time(self):
        return self.static_shift.start_time

    @property
    def shift_end_time(self):
        return self.static_shift.end_time

    @property
    def duration_hours(self):
        """Calculate scheduled shift duration"""
        from datetime import datetime, timedelta
        start = datetime.combine(self.shift_date, self.shift_start_time)
        end = datetime.combine(self.shift_date, self.shift_end_time)

        if end < start:
            end += timedelta(days=1)

        delta = end - start
        return round(delta.total_seconds() / 3600, 2)

    @property
    def is_active(self):
        return self.shift_status == 'shift_in_progress'

    @property
    def has_attendance(self):
        return self.attendances.exists()

    def clean(self):
        """Validate no overlapping shifts for same agent on same date"""
        check_shift_overlaps = Shift.objects.filter(
            shift_agent=self.shift_agent,
            shift_date=self.shift_date
        ).exclude(pk=self.pk)

        if check_shift_overlaps.exists():
            raise ValidationError(f"{self.shift_agent} already has a shift on {self.shift_date}")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.shift_agent} - {self.shift_date} ({self.static_shift.name})"

    class Meta:
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'
        ordering = ['-shift_date']
        unique_together = (('shift_agent', 'shift_date'),)


    # validate shift before save
    """def clean(self):
        if self.shift_agent and self.shift_date:
            check_shift_overlaps = Shift.objects.filter(shift_agent=self.shift_agent, shift_date=self.shift_date)\
            .exclude(pk=self.pk) # exclude self when running updates

            if check_shift_overlaps.exists():
                raise ValidationError(f"{self.shift_agent} Shift overlap already exists on {self.shift_date}")

    # run validation before saving
    def save(self, *args, **kwargs):
        self.full_clean() #validate before saving
        return super().save(*args, **kwargs)

    @property
    def duration_hours(self):
        Calculate scheduled shift duration
        from datetime import datetime, timedelta

        start = datetime.combine(self.shift_date, self.shift_start_time)
        end = datetime.combine(self.shift_date, self.shift_end_time)

        # Handle overnight shifts
        if end < start:
            end += timedelta(days=1)

        delta = end - start
        return round(delta.total_seconds() / 3600, 2)

    @property
    def is_active(self):
        Check if shift is currently in progress
        return self.shift_status == 'shift_in_progress'

    @property
    def is_upcoming(self):
        Check if shift is scheduled for future
        from datetime import date
        return self.shift_date >= date.today() and self.shift_status == 'shift_scheduled'

    @property
    def has_attendance(self):
        Check if there's an attendance record for this shift
        return self.attendances.exists()


    def __str__(self):
        return f"{self.shift_agent} - {self.shift_date} ({self.shift_type})"

    class Meta:
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'
        ordering = ['-shift_date', 'shift_start_time']
        unique_together = (('shift_agent', 'shift_date'),) # Agent cannot have more than a shift per day"""


""" Model for attendance tracking """
class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='employee_attendance')
    shift_attendance = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')

    clock_in_time = models.DateTimeField()
    clock_out_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True)

    status = models.CharField(max_length=50, choices=ATTENDANCE_TYPES, default='clocked_in')
    date = models.DateField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # validation fields
    validation_error = models.TextField(null=True, blank=True)
    validation_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - {self.shift_attendance}({self.status})"

    def calculate_duration_hours(self):
        if self.clock_in_time and self.clock_out_time:
            timer = self.clock_out_time - self.clock_in_time
            self.duration_hours = round(timer.total_seconds() / 3600, 2)
            return self.duration_hours
        return None

    def validate_clock_out(self):
        """
        Validate clock-out against shift requirements.
        """
        if not self.shift_attendance:
            return {
                'success': False,
                'message': 'No shift assigned to this attendance record',
                'duration_hours': None
            }

        # Set clock_out_time if not already set
        if not self.clock_out_time:
            self.clock_out_time = timezone.now()

        # Calculate duration
        duration = self.calculate_duration_hours()
        if duration is None:
            return {
                'success': False,
                'message': 'Cannot calculate duration. Missing clock in/out times',
                'duration_hours': None
            }

        # Get required hours from StaticShift
        required_hours = self.shift_attendance.static_shift.get_shift_duration_hours()
        duration_float = float(self.duration_hours)

        # Validate against shift template
        if duration_float < required_hours:
            error_msg = (
                f"Insufficient work hours. Expected: {required_hours}hrs, "
                f"Got: {duration_float:.2f}hrs"
            )
            self.validation_error = error_msg
            self.status = 'incomplete'

            return {
                'success': False,
                'message': error_msg,
                'duration_hours': duration_float,
                'required_hours': required_hours
            }
        else:
            success_msg = (
                f"Clock out successful. Duration: {duration_float:.2f}hrs "
                f"(Required: {required_hours}hrs)"
            )
            self.validation_error = None
            self.status = 'completed'

            return {
                'success': True,
                'message': success_msg,
                'duration_hours': duration_float,
                'required_hours': required_hours
            }

    class Meta:
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendances'
        ordering = ['-clock_in_time']


""" create reports model class """
class ActivityReport(models.Model):
    # ONE employee reference
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='activity_reports')

    # The key relationship - tells us WHO worked and WHEN plus the appriver
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE,related_name='reports')
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reports')


    shift_activity_type = models.CharField(max_length=50, choices=SHIFT_TYPES, default='Night_Shift')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES, default='other')
    activity_description = models.TextField()
    tickets_resolved = models.IntegerField(default=0)
    calls_made = models.IntegerField(default=0)
    issues_escalated = models.IntegerField(default=0)
    notes = models.TextField()

    activity_submitted_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    activity_approved_at = models.DateTimeField(auto_now=False, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} - {self.activity_submitted_at}({self.shift_activity_type})"

    # access shift if present though attendance
    @property
    def shift(self):
        # fetch shift if present
        return self.attendance.shift if self.attendance else None


    # get shift type if present from attendance
    @property
    def shift_type(self):
        #fetch shift type if shift exists
        if self.attendance and self.attendance.shift:
            return self.attendance.shift.shift_type
        return "Unscheduled"


    @property
    def supervisor(self):
        """ fetch employee's supervisor """
        return self.employee.supervisor if self.employee else None

    class Meta:
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['report_type', 'activity_submitted_at']
        #unique_together = (('report_type', 'shift_active_agent'),)


