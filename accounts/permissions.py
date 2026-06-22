from django.core.exceptions import ObjectDoesNotExist
from rest_framework import permissions, viewsets

"""create roles based on user type
Employee_Agent - create, view - shift and reports
Admin - create, view and delete (shifts and reports)
Supervisor  - View shift and report, update report,
Use BasePermission
implement has_permission for views and has_obj_permission  to enable manipulation
The view should be for authenticated users
"""

class UserShiftPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        try:
            employee = request.user.employee_profile
        except ObjectDoesNotExist:
            return False

        if employee.user_type == 'Admin':
            return True

        if employee.user_type == 'Employee_Agent':
            return view.action in ['list', 'retrieve', 'create']

        if employee.user_type == 'Supervisor':
            return view.action in ['list', 'retrieve']

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_staff or user.is_superuser:
            return True

        try:
            employee = user.employee_profile
        except ObjectDoesNotExist:
            return False

        if employee.user_type == 'Admin':
            return True

        if employee.user_type == 'Employee_Agent':
            if request.method in permissions.SAFE_METHODS:
                return obj.shift_agent == employee
            return False

        if employee.user_type == 'Supervisor':
            return request.method in permissions.SAFE_METHODS

        return False