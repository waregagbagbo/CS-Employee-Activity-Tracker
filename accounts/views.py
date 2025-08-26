from django.shortcuts import render
from rest_framework.generics import CreateAPIView
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from Cs_Tracker.settings import AUTH_USER_MODEL
from .models import CustomUser
from .serializers import UserSerializer,UserRegistrationSerializer
from rest_framework import generics, status
from django.apps import apps

# our standalone custom user model object instead of direct import
User = apps.get_model(AUTH_USER_MODEL)


# we can use API VIEW to enable user registration
class UserRegistration(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # object instance
        user = serializer.save()
        message = 'User created successfully'
        return Response({message,UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class UserProfileViews(generics.RetrieveUpdateAPIView):
    queryset = User.object.all()
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user