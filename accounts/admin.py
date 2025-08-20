from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import Employee,CustomUser

# Register your models here.
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username','email','first_name','last_name','bio',)

admin.site.register(CustomUser,CustomUserAdmin)


class EmployeeAdmin(admin.ModelAdmin):
    model = Employee
    list_display = ('user',)
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('user_type','user',)

admin.site.register(Employee, EmployeeAdmin)
