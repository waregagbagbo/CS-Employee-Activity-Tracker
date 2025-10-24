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

# create a BasePermision View
class OwnerReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if list.actions in ['create', 'view']:
            return user.is_Employee_Agent

class SupervisorReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if list.actions in ['create', 'view']:
            return user.is_Supervisor

class AdminReport(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        return user in ['Admin', 'superuser']






