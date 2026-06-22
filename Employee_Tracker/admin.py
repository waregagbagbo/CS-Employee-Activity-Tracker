from django.contrib import admin
from Employee_Tracker.models import *

# Register your models here.

class StaticShiftAdmin(admin.ModelAdmin):
    list_display = ('name','shift_type','start_time','end_time',)

class ShiftAdmin(admin.ModelAdmin):
    list_display = ('id','shift_date','shift_status','shift_agent',)
    list_filter = ('shift_agent','shift_date','shift_status',)
    search_fields = ('shift_status','shift_start_time',)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ('report_type','activity_submitted_at','supervisor','is_approved','shift_activity_type',)
    list_filter = ('employee','report_type','tickets_resolved','is_approved',)


class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee','clock_in_time', 'clock_out_time','date',)
    list_filter = ('employee','clock_in_time','clock_out_time','date',)


admin.site.register(Shift,ShiftAdmin)
admin.site.register(Shift, ShiftAdmin)
admin.site.register(ActivityReport,ActivityAdmin)
admin.site.register(Attendance,AttendanceAdmin)
