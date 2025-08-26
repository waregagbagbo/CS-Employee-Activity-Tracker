from django.contrib import admin
from Employee_Tracker.models import *

# Register your models here.

class ShiftAdmin(admin.ModelAdmin):
    list_display = ('shift_type','shift_date','shift_status','shift_agent',)
    list_filter = ('shift_type','shift_date','shift_status','shift_agent',)

    search_fields = ('shift_type','shift_agent','shift_status','shift_start_time',)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ('report_type','activity_submitted_at','employee_emp',)
    list_filter = ('employee_emp','report_type','tickets_resolved','is_approved')


class WebHookLogAdmin(admin.ModelAdmin):
    list_display = ('web_hook_config','response_status')

admin.site.register(Shift, ShiftAdmin)
admin.site.register(ActivityReport,ActivityAdmin)
admin.site.register(WebHookLog, WebHookLogAdmin)