from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('Employee_Tracker', '0002_add_shift_field'),  # replace with your last migration
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='status',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('clocked_in', 'Clocked_In'),
                    ('clocked_out', 'Clocked_Out'),
                    ('on_break', 'Break'),
                ],
                default='clocked_in',
            ),
        ),
    ]
