from django.test import TestCase
from .models import Employee

# Create your tests here.
""" create tests for the employee profile """


def test_delete_employee():
    employee = Employee()
    pass


class EmployeeProfileTest(TestCase):
    def setUp(self):
        self.employee = Employee(
            first_name='John',
            last_name='Doe',
            email='john@gmail.com',
            username='john1',
            password='',
            password2='',

        )
        self.employee.save()
        self.employee2 = Employee(
            first_name='Jane',
            last_name='Doe',
            email='',
            username='jane2',
            password='',
            password2='',
        )
        self.employee2.save()

    def test_create_employee(self):
        employee = Employee(
            first_name='John',
            last_name='Doe',
            email='',
            username='john1',
            password='',
            password2='',

        )
        employee.save()
        employee2 = Employee(
            first_name='Jane',
            last_name='Doe',
            email='',
            username='jane2',
            password='',
            password2='',
        )
        employee2.save()
        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(Employee.objects.first().first_name, 'John')
        self.assertEqual(Employee.objects.first().last_name, 'Doe')
        self.assertEqual(Employee.objects.first().email, '')
        self.assertEqual(Employee.objects.first().username, 'john1')
        self.assertEqual(Employee.objects.first().password, '')
        self.assertEqual(Employee.objects.first().password2, '')

        self.assertEqual(Employee.objects.last().first_name, 'Jane')
        self.assertEqual(Employee.objects.last().last_name, 'Doe')
        self.assertEqual(Employee.objects.last().email, '')
        self.assertEqual(Employee.objects.last().username, 'jane2')
        self.assertEqual(Employee.objects.last().password, '')
        self.assertEqual(Employee.objects.last().password2, '')


    def test_update_employee(self):
        employee = Employee(
            first_name='John',
            last_name='Doe',
            email='',
            username='john1',
            password='',
            password2='',

        )
        employee.save()

        employee2 = Employee(
            first_name='Jane',
            last_name='Doe',
            email='',
            username='jane2',
            password='',
            password2='',

        )
        employee2.save()

        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(Employee.objects.first().first_name, 'John')
        self.assertEqual(Employee.objects.first().last_name, 'Doe')
        self.assertEqual(Employee.objects.first().email, '')
        self.assertEqual(Employee.objects.first().username, 'john1')
        self.assertEqual(Employee.objects.first().password, '')
        self.assertEqual(Employee.objects.first().password2, '')

        self.assertEqual(Employee.objects.last().first_name, 'Jane')
        self.assertEqual(Employee.objects.last().last_name, 'Doe')
        self.assertEqual(Employee.objects.last().email, '')
        self.assertEqual(Employee.objects.last().username, 'jane2')
        self.assertEqual(Employee.objects.last().password, '')
        self.assertEqual(Employee.objects.last().password2, '')
