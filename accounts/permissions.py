from rest_framework import permissions
from accounts.models import *

def is_admin(user):
    if user.is_superuser:
        return True


def is_employee(user):
    if user.is_employee_agent or user.is_staff:
        return True

def is_manager(user):
    if user.is_supervisor or user.is_staff:
        return True
