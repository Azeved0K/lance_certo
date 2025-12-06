# Generated migration adding password reset fields
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_usuario_password_reset_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='password_reset_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='usuario',
            name='password_reset_attempts',
            field=models.IntegerField(default=0),
        ),
    ]

