from .models import CustomUser
from rest_framework import serializers

user = CustomUser() # create an object from the AUTH_USER_MODEK
# create user serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 5}}

    def validate_email(self, value):
        # To check the status of the object
        if self.instance is None:
            # To create the
            if user.objects.filter(email=value).exists():
                raise serializers.ValidationError('Email already registered')
            else:
                return value

