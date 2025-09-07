from django.apps import AppConfig


class EmployeeTrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Employee_Tracker'


def get_model(AUTH_USER_MODEL):
    return None