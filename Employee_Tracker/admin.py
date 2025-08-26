from django.contrib import admin
from Employee_Tracker.models import *

# Register your models here.

class ShiftAdmin(admin.ModelAdmin):
    list_display = ('shift_type','shift_date','shift_status','shift_agent',)
    list_filter = ('shift_type','shift_date','shift_status','shift_agent',)

    search_fields = ('shift_type','shift_agent','shift_status','shift_start_time',)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ('report_type','activity_submitted_at','supervisor',)
    list_filter = ('supervisor','report_type','tickets_resolved','is_approved')


class WebHookLogAdmin(admin.ModelAdmin):
    list_display = ('webhook_config','response_status',)

class WebHookAdmin(admin.ModelAdmin):
    list_display = ('webhook_name','webhook_url','webhook_event_types',)
    list_filter = ('webhook_created_by','is_active',)

admin.site.register(Shift, ShiftAdmin)
admin.site.register(ActivityReport,ActivityAdmin)
admin.site.register(WebHookLog, WebHookLogAdmin)
admin.site.register(WebHook, WebHookAdmin)