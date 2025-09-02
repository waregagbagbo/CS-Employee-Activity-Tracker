from django.contrib.auth import password_validation,authenticate
from rest_framework import serializers
from Cs_Tracker.settings import AUTH_USER_MODEL
from django.apps import apps

from accounts.models import Department

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
    department = serializers.SlugRelatedField(queryset=Department.objects.all(), slug_field='title')
    password = serializers.CharField(write_only=True,style={'input_type': 'password'}, min_length=5)
    password_confirmation = serializers.CharField(write_only=True,style={'input_type': 'password'})
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name','department','password', 'password_confirmation')
        extra_kwargs = {'password': {'write_only': True,'min_length': 5}}

    def validate(self, value):
        password = value.get('password')
        password_confirmation = value.get('password_confirmation')

        if password != password_confirmation:
            raise serializers.ValidationError('Passwords do not match,try again')

        # try to validate the password
        password_validation.validate_password(password)
        return value

    def create(self, validated_data):
        # remove pass confirmation
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password) #sets the pass
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True,style={'input_type': 'password'}, min_length=5)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
            #user = User.objects.get(email=email)
            if not user:
                raise serializers.ValidationError('Incorrect password or email')
            if not user.is_active:
                raise serializers.ValidationError('User is not active')
            # now add validated user
            attrs['user'] = user
            return attrs






