from django.core.exceptions import ObjectDoesNotExist
from rest_framework import permissions
from rest_framework.permissions import BasePermission
from accounts.models import Employee

"""create roles based on user type
Employee_Agent - create, view - shift and reports
Admin - create, view and delete (shfts and reports)
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
            #user_type = Employee.objects.select_related('user').get(user=user)
            emp_profile = Employee.user_type
        except ObjectDoesNotExist:
            return False

        method  = request.method  # to fetch the HTTP methods into action
        if method in ['GET','HEAD']:
            action = 'view'
        elif method == 'POST':
            action = 'create'
        elif method in ['PUT','PATCH']:
            action = 'update'
        elif method == 'DELETE':
            action = 'delete'

        # Logic based on user_type
        if emp_profile == 'Employee_Agent' and action in ['create', 'view']:
            return obj

        elif emp_profile == 'Supervisor' and action in ['update', 'view']:
            return obj

        elif emp_profile == 'Admin' and action in ['create', 'view','delete','update']:
            return
        else:
            return False

# create perms for shifts
"""class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET','HEAD']:
            return True
        elif request.method in ['POST','PUT','PATCH']:
            return obj.user == request.user
        elif request.method in ['DELETE']:
            return obj.u == request.user.is_superuser
        else:
            return False"""


# create a BasePermision View
""""class OwnerReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        try:
            return obj.owner == user
        except ObjectDoesNotExist:
            print('Permission denied')
            return False

class SupervisorReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        try:
            return request.user== 'Supervisor'
        except ObjectDoesNotExist:
            print('Permission denied')
            return False


class AdminReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        return request.user in ['Admin','superuser']"""






