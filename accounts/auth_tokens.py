from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

# set the model
User = get_user_model()

# set the auth-token usage
user = User.objects.get(email = 'email')
token, created = Token.objects.get_or_create(user = user)
print(token.key)
