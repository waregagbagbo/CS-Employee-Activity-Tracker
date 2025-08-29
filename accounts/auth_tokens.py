from rest_framework.authtoken.models import Token
from django.conf import settings
from Employee_Tracker import apps

# set the model
User = apps.get_model(settings.AUTH_USER_MODEL)

# set the authtoken usage
tokens = User.objects.get(email = 'email')
token, created = Token.objects.get_or_created(tokens = tokens)
print(token.key)
