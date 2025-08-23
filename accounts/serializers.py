from .models import CustomUser
from rest_framework import serializers

# create user serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True, 'min_length': 5}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        # validate the user details
        username = user.username.validate(validated_data['username'])
        email = user.email.validate(validated_data['email'])
        password = validated_data['password']
        return user.save()


    def create(self, validated_data):
        data = super(UserSerializer, self).create(validated_data)
        username = data['username']
        email = data['email']
        password = data['password']
        data.save()
        return data
