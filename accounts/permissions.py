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

class UserTypeReportPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # ensures use is logged in, lest error
        return request.user.is_authenticated

    # runs when accessing a specific object
    def has_object_permission(self, request, view, obj):
        # access the user object
        user = request.user
        try:
            employee = user.employee_profile
            emp_profile = employee.user_type
        except ObjectDoesNotExist:
            return False

        method  = request.method  # to fetch the HTTP methods into action

        if method in ['GET','HEAD','OPTIONS']:
            action = 'view'
        elif method == 'POST':
            action = 'create'
        elif method in ['PUT','PATCH']:
            action = 'update'
        elif method == 'DELETE':
            action = 'delete'

        # Logic based on user_type
        # admin has full access
        if user.is_staff or emp_profile == 'Admin':
            return True

        # Agent can create and view their own reports
        if emp_profile == 'Employee_Agent':
            if action not in ['create', 'view']:
                return False
            # ascertain if hs
            return obj.shift_active_agent == employee

        elif emp_profile == 'Supervisor':
            if action in ['update', 'view']:
                return obj
        else:
            return False

""" restrict shifts to be actioned based on user_type
 If agent, create, and view
 Admin - Full access (CRUD)
 Supervisor - view only
 """
# permissions for shifts
class UserShiftPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        try:
            employee = user.employee_profile
            emp_profile = employee.user_type
        except ObjectDoesNotExist:
            return False

        method = request.method

        if method in ['GET','HEAD','OPTIONS']:
            action = 'view'

        elif method == 'POST':
            action = 'create'

        elif method in ['PUT','PATCH']:
            action = 'update'

        elif method in ['DELETE']:
            action = 'delete'

        else:
            return False

        # set admin to have the full access
        if user.is_staff or emp_profile == 'Admin':
            return True

        # query the various user_types permission
        if emp_profile == 'Employee_Agent':
            if action in ['create', 'view']:
                return obj.shift_agent == employee # return resultant objects
            return False

        elif emp_profile == 'Supervisor':
            if action in ['view']:
                return obj
            return False
        return False

class CanEditOwnProfile(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff:
            return True
        return obj.user == request.user

class DepartmentViewPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Only Admins/Staff can POST, PUT, DELETE
        return request.user.is_staff or request.user.is_superuser

    """def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff:
            return True
        return obj.user == request.user"""










