import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import Employee
from Employee_Tracker.models import StaticShift,Shift


class Command(BaseCommand):
    help = 'Auto-generate random shifts for all employees'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Number of days to generate shifts for')
        parser.add_argument('--start-date', type=str, help='Start date (YYYY-MM-DD)')

    def handle(self, *args, **options):
        days = options['days']
        start_date = timezone.now().date()

        if options['start_date']:
            start_date = timezone.datetime.strptime(options['start_date'], '%Y-%m-%d').date()

        # Get all active employees that are agents
        employees = Employee.objects.filter(is_active=True, is_employee_agent=True)

        if not employees.exists():
            self.stdout.write(self.style.ERROR('No active employees found'))
            return

        # Get all static shifts
        static_shifts = list(StaticShift.objects.all())

        if not static_shifts:
            self.stdout.write(self.style.ERROR('No static shifts found. Create them first!'))
            return

        admin_user = Employee.objects.filter(is_superuser=True).first()
        shifts_created = 0

        for day_offset in range(days):
            shift_date = start_date + timedelta(days=day_offset)

            for employee in employees:
                # Pick ONE random shift type
                random_shift = random.choice(static_shifts)

                # Check if already exists
                shift_exists = Shift.objects.filter(
                    shift_agent=employee,
                    shift_date=shift_date,
                    static_shift=random_shift
                ).exists()

                if not shift_exists:
                    Shift.objects.create(
                        shift_agent=employee,
                        shift_date=shift_date,
                        static_shift=random_shift,
                        shift_status='shift_scheduled',
                        created_by=admin_user
                    )
                    shifts_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Created {shifts_created} shifts for {len(employees)} employees over {days} days')
        )