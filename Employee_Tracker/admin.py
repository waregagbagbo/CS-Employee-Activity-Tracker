from django.contrib import admin
from Employee_Tracker.models import *

# Register your models here.

class ShiftAdmin(admin.ModelAdmin):
    list_display = ('shift_type','shift_date','shift_status','shift_agent',)
    list_filter = ('shift_type','shift_date','shift_status','shift_agent',)

    search_fields = ('shift_type','shift_agent','shift_status','shift_start_time',)

admin.site.register(Shift, ShiftAdmin)