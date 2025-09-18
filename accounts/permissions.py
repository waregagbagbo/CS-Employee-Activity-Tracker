from rest_framework.permissions import BasePermission

#create an admin and assign users to groups.
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Admin').exists()

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Employee').exists()

class IsSupervisor(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Supervisor').exists()


# use a combine class permission class
class IsInAllowedGroup(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name__in=['Employee','Admin','Supervisor']).exists()