from rest_framework.permissions import BasePermission

# use a combine class permission class
class IsInAllowedGroup(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name__in=['Employee','Admin','Supervisor']).exists()