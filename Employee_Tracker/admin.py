from django.contrib import admin
from Employee_Tracker.models import *

# Register your models here.

class ShiftAdmin(admin.ModelAdmin):
    list_display = ('shift_type','shift_date','shift_status','shift_agent','shift_start_time','shift_end_time',)
    list_filter = ('shift_agent','shift_type','shift_date','shift_status',)
    search_fields = ('shift_type','shift_status','shift_start_time',)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ('report_type','activity_submitted_at','supervisor','is_approved','shift_activity_type',)
    list_filter = ('supervisor','report_type','tickets_resolved','is_approved')


admin.site.register(Shift, ShiftAdmin)
admin.site.register(ActivityReport,ActivityAdmin)
#admin.site.register(WebHook, WebHookAdmin)
#admin.site.register(WebHookLog, WebHookLogAdmin)
