from rest_framework import permissions
from rest_framework.permissions import BasePermission
from Employee_Tracker.models import *

# use a combine class permission class
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_admin or request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        return request.user.is_admin or request.user.is_superuser

# employee permission and role.
class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

    def has_object_permission(self, request, view, obj):
        # define endpoints that a user can modify
        endpoints = ['GET', 'POST', 'PUT']
        try:
            if request.user.is_authenticated and not request.user.is_staff:
                # fetch the endpoints the user can access
                return endpoints in request.user.roles
        except AttributeError:
            print('You are not logged in and do not have permission to access this endpoint')
        return request.user.is_employee

# This class allows owner to write
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # other non-owners to have view rights, GET,HEAD,OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
     # object owner to have the write permission
        return obj.owner == request.user or request.user.is_staff


class IsSuperVisor(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_supervisor:
            return True


# create a permission to regulate the view
class ActivityReportsPermissions(BasePermission):
    # declare view method
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

        """declare user object"""
        user_profile = Employee.objects.get(user= request.user)
        # fetch the view controls and limit the view
        try:
            if user_profile.user_type == 'Admin':
                return True
            elif user_profile.user_type == 'Supervisor' and view.action in ['DESTROY','UPDATE']:
                    return True

        except AttributeError:
            print('You are not logged in and do not have permission to access this endpoint')
            return True

    # object view
    def has_object_permission(self, request, view, obj):
        # object level permission check
        if request.user.is_authenticated:
            return True

        user_profile = Employee.objects.get(user=request.user)
        try:
            if user_profile.user_type == 'Supervisor':
                return request.method in permissions.SAFE_METHODS
        except Employee.DoesNotExist:
            return False









