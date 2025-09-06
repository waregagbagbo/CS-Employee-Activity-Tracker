from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import EmployeeProfile, CustomUser, Department


# Register your models here.
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username','email','first_name','last_name','bio',)

admin.site.register(CustomUser,CustomUserAdmin)

#@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    model = EmployeeProfile
    list_display = ('user',)
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('user_type','user',)
    exclude = ('supervisor',)
    #readonly_fields = ('supervisor',) # not writable

class DepartmentAdmin(admin.ModelAdmin):
    model = Department
    list_display = ('title',)

admin.site.register(EmployeeProfile,EmployeeProfileAdmin)
admin.site.register(Department, DepartmentAdmin)
