import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import Employee
from Employee_Tracker.models import StaticShift,Shift


class Command(BaseCommand):
    help = 'Auto-generate random shifts for all active employee agents'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30)
        parser.add_argument('--start-date', type=str)

    def handle(self, *args, **options):
        days = options['days']
        start_date = timezone.now().date()

        if options['start_date']:
            start_date = timezone.datetime.strptime(options['start_date'], '%Y-%m-%d').date()

        employees = Employee.objects.filter(is_active=True, user_type='employee_agent')

        if not employees.exists():
            self.stdout.write(self.style.ERROR('❌ No active employee agents found'))
            return

        static_shifts = list(StaticShift.objects.all())

        if not static_shifts:
            self.stdout.write(self.style.ERROR('❌ No static shifts found'))
            return

        admin_user = Employee.objects.filter(user_type='admin').first()
        shifts_created = 0

        for day_offset in range(days):
            shift_date = start_date + timedelta(days=day_offset)

            for employee in employees:
                # ✅ Check if employee has ANY shift on this date
                shift_exists = Shift.objects.filter(
                    shift_agent=employee,
                    shift_date=shift_date
                ).exists()

                if not shift_exists:
                    # Only then pick random shift
                    random_shift = random.choice(static_shifts)
                    Shift.objects.create(
                        shift_agent=employee,
                        shift_date=shift_date,
                        static_shift=random_shift,
                        shift_status='shift_scheduled',
                        created_by=admin_user
                    )
                    shifts_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Created {shifts_created} shifts for {len(employees)} employee agents over {days} days')
        )



