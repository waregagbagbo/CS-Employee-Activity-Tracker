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
        return user

