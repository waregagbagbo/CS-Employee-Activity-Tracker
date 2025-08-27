from django.contrib.auth import password_validation
from rest_framework import serializers
from Cs_Tracker.settings import AUTH_USER_MODEL
from django.apps import apps

User = apps.get_model(AUTH_USER_MODEL) # create an object from the AUTH_USER_MODEK
# create user serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 5}}

    def validate_email(self, value):
        # To check the status of the object
        if self.instance is None:
            # To create the
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError('Email already registered')
            else:
                return value

# create registration serializer
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name','password', 'password_confirmation')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 5}}

    def validate_password(self, value):
            if value['password'] != value['password_confirmation']:
                raise serializers.ValidationError('Passwords do not match')
            value = password_validation.validate_password(value)
            return value

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        user = AUTH_USER_MODEL.create(**validated_data)
        user.set_password(validated_data['password'])
        user.save()

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        return attrs

    def create(self, validated_data):
        validated_data.pop('password')
        user = AUTH_USER_MODEL.create(**validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user





