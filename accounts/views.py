from datetime import datetime

from django.contrib.contenttypes.models import ContentType
from rest_framework.authtoken.models import Token
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer, UserLoginSerializer, EmployeeSerializer
from rest_framework import generics, status
from django.contrib.auth import login, logout, get_user_model

# our standalone custom user model object instead of direct import
User = get_user_model()

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
        return Response(message,status=status.HTTP_201_CREATED,headers={
            "connection":"keep-alive","date":datetime
        })



"""class UserProfileViews(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user"""

class UserLogin(APIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    @staticmethod
    def post(request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.save()
        login(request, user)
        # get the token from the signals
        token,created = Token.objects.get_or_create(user=user)
        #token = {'token':user.auth_token.key}, # send the str part token
        context = {"message":'User logged in successfully',
                   'token':token.key
                   }
        return Response(context,status=status.HTTP_200_OK)

# logout view for token authentication
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def post(self,request):
        # checks if user has auth token to be deleted
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()

        logout(request) # for session auth clearing
        context ={'message':'User logged out successfully'}
        return Response(context,status=HTTP_201_CREATED,headers={})

    # the traditional django using unsecure GET
    def get(self, request):
        return self.post(request)


