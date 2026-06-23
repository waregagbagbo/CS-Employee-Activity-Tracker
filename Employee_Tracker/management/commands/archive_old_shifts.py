from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from myapp.models import Shift, ShiftArchive, Attendance, ActivityReport
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Archive shifts older than 30 days (keeps data, deletes old records)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep (default: 30)'
        )
        parser.add_argument(
            '--delete',
            action='store_true',
            help='Actually delete shifts (default: dry-run only)'
        )

    def handle(self, *args, **options):
        days = options['days']
        should_delete = options['delete']
        cutoff_date = timezone.now() - timedelta(days=days)

        # Only archive completed/no_show shifts
        shifts_to_archive = Shift.objects.filter(
            shift_created_at__lt=cutoff_date,
            shift_status__in=['shift_completed', 'no_show']
        )

        count = shifts_to_archive.count()

        if count == 0:
            self.stdout.write(self.style.WARNING('No shifts to archive'))
            return

        if not should_delete:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would archive {count} shifts')
            )
            self.stdout.write(
                self.style.WARNING('Run with --delete to actually archive')
            )
            return

        try:
            archived_count = 0

            for shift in shifts_to_archive:
                # Check if has related reports/attendance
                has_attendance = Attendance.objects.filter(shift_attendance=shift).exists()
                has_reports = ActivityReport.objects.filter(attendance__shift_attendance=shift).exists()

                if has_attendance or has_reports:
                    # Don't delete if has related data
                    logger.warning(f"Skipping shift {shift.id} - has related attendance/reports")
                    continue

                # Archive the shift
                ShiftArchive.objects.create(
                    shift_agent=shift.shift_agent,
                    shift_date=shift.shift_date,
                    static_shift=shift.static_shift,
                    shift_status=shift.shift_status,
                    shift_created_at=shift.shift_created_at,
                    created_by=shift.created_by,
                    shift_updated_at=shift.shift_updated_at,
                    original_shift_id=shift.id
                )

                # Delete the shift
                shift.delete()
                archived_count += 1

            logger.info(f"Archived {archived_count} shifts")
            self.stdout.write(
                self.style.SUCCESS(f'Successfully archived {archived_count} shifts')
            )

        except Exception as e:
            logger.error(f"Error archiving shifts: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )