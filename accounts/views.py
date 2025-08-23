from django.shortcuts import render
from rest_framework.generics import CreateAPIView
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CustomUser
from .serializers import UserSerializer
from rest_framework import generics, status


# Create your views here.
def user_registration(request):
    if request.method == 'POST':
        data = UserSerializer(data=request.data)
        if data.is_valid():
            data.save()
            username = data.data['username']
            email = data.data['email']
            password = data.data['<PASSWORD>']



# we can use API VIEW to enable user registration
class UserRegistration(CreateAPIView):
    serializer_class = UserSerializer
    model = settings.AUTH_USER_MODEL
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

