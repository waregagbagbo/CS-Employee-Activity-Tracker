from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import Employee, CustomUser, Department


# Register your models here.
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username','email','first_name','last_name','bio',)

#@admin.register(EmployeeProfile)
class EmployeeAdmin(admin.ModelAdmin):
    model = Employee
    list_display = ('user','department','supervisor','user_type',)
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('user_type','user',)
    exclude = ('supervisor',)
    #readonly_fields = ('supervisor',) # not writable

class DepartmentAdmin(admin.ModelAdmin):
    model = Department
    list_display = ('title',)

admin.site.register(Employee,EmployeeAdmin)
admin.site.register(Department, DepartmentAdmin)
admin.site.register(CustomUser,CustomUserAdmin)

