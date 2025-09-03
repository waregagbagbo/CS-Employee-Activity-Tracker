from urllib import request
from django.contrib.redirects.models import Redirect
from django.db.migrations import serializer
from django.shortcuts import render
from rest_framework.generics import CreateAPIView
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from Cs_Tracker.settings import AUTH_USER_MODEL
from .models import CustomUser
from .serializers import UserSerializer, UserRegistrationSerializer, UserLoginSerializer
from rest_framework import generics, status
from django.apps import apps
from django.contrib.auth import login, logout

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
        user.set_password(serializer.validated_data['password'])
        user.save()
        message = {'message':'User created successfully'}
        return Response(message,status=status.HTTP_201_CREATED)


class UserProfileViews(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserLogin(APIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    #success_url = settings.REDIRECT_URL

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.save()
        login(request, user)
        # get the token from the signals
        token = {'token':'user.auth_token.key'}, # send the str part token
        context = {"message":'User logged in successfully'}
        return Response(context)
        #return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout = request.user.auth_token.delete()
        context ={'message':'user logged out successfully'}
        return Response(logout, context,status=status.HTTP_200_OK)