from rest_framework import permissions
from rest_framework.permissions import BasePermission
from accounts.models import *

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsEmployee(permissions.BasePermission):
    """Employee agents can perform basic operations"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            profile = request.user.employee_profile
            return profile.user_type == 'Employee_Agent'
        except Employee.DoesNotExist:
            return False

class IsSupervisor(permissions.BasePermission):
    """Supervisors can manage their team"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

class IsOwnerOrSupervisor(permissions.BasePermission):
    """Users can only access their own data, supervisors can access team data"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Admin has full access
        if request.user.is_superuser:
            return True

        try:
            user_profile = request.user.employee_profile

            # If it's the user's own data
            if hasattr(obj, 'employee') and obj.employee.user == request.user:
                return True

            # If user is supervisor and obj belongs to their supervised employee
            if user_profile.user_type in ['Supervisor', 'Manager']:
                if hasattr(obj, 'employee'):
                    return obj.employee.supervisor == user_profile

        except Employee.DoesNotExist:
            pass

        return False

# Combined permissions for common use cases
class CanCreateReport(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.has_perm('accounts.can_create_report'))


class CanViewReports(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.has_perm('accounts.can_view_report'))

