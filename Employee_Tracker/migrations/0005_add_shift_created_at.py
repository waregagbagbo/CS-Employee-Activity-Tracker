from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('Employee_Tracker', '0004_add_created_at_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='shift',
            name='shift_created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='shift',
            name='shift_updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]




