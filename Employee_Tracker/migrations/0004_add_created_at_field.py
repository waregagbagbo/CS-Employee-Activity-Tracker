from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('Employee_Tracker', '0003_add_status_field'),  # replace with your last migration
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='attendance',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
