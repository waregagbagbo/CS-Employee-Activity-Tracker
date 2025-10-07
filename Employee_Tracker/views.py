from datetime import datetime
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.migrations import serializer
from requests import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from accounts.models import Employee, Department
from accounts.permissions import IsInAllowedGroup
from .models import Shift,ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication,filters
from rest_framework import generics
from rest_framework.decorators import permission_classes
from rest_framework import status

User = get_user_model()



# Views implemented using generics
class EmployeeProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination
    permission_classes = (IsAuthenticated,)
    authentication_classes = (SessionAuthentication,authentication.TokenAuthentication,)

    def get_queryset(self):
        # get the instance object of the current user
        employee_profile = Employee.objects.filter(user=self.request.user)
        try:
            if self.request.user.is_superuser or self.request.user.is_staff:
                return Employee.objects.all()
        except ObjectDoesNotExist as e:
            print(f'User with that profile does not exist {e}')

        return employee_profile

    """"def get_queryset(self):
        employee_profile = Employee.objects.get(user=self.request.user)
        if self.request.user.is_staff:
            employee_profile = Employee.objects.all()
        return employee_profile

    # update logic
    def put(self, request, pk):
        # fetch the model instance
        try:
            user_profile = self.get_object(pk=pk)
        except ObjectDoesNotExist:
            print('Object does not exist')
        # deserialize and validate
        serializer = EmployeeProfileSerializer(user_profile, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)"""


#Shift view
class ShiftAPIViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shift_agent','shift_type','shift_status']
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]
    PaginationClass = PageNumberPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Shift.objects.none()
        try:
            employee_profile = Employee.objects.get(user=user)
            return Shift.objects.filter(shift_agent=employee_profile)
        except ObjectDoesNotExist:
            return Shift.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        try:
            employee_profile = Employee.objects.get(user=user)
            timer = datetime.now().time()
            serializer.save(shift_agent=employee_profile, shift_start_time=timer)
            print('Shift updated successfully')
        except ObjectDoesNotExist:
            raise ValidationError('Employee does not exist')

#Department view
class DepartmentAPIViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    permission_classes = [IsAuthenticated]

#WebHook view
""""class WebHookViewSet(viewsets.ModelViewSet):
    queryset = WebHook.objects.all()
    serializer_class = WebHookSerializer

    def get_queryset(self):
        return WebHook.objects.all()


class WebHookLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebHookLog.objects.all()
    serializer_class = WebHookLogSerializer
    permission_classes = [AllowAny]
    #authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]"""

#Activity report view
class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    permission_classes = [IsInAllowedGroup]
    serializer_class = ActivityReportSerializer
    authentication_classes = [SessionAuthentication,authentication.TokenAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['activity_type','activity_status']
    ordering_fields = ['activity_type','activity_status']
    pagination_class = PageNumberPagination

    #filter reports based on the users present
    def get_queryset(self):
        try:
            user = Employee.objects.get(user=self.request.user)
        except ObjectDoesNotExist:
            return ActivityReport.objects.none()

        if self.request.user.groups.filter(name__in=['Supervisor','Admin']).exists():
            return ActivityReport.objects.filter(is_approved = False)
        else:
            return ActivityReport.objects.select_related('shift_active_agent').filter(shift_active_agent=user,is_approved = True)

    # get perms
    def get_permissions(self):
        if self.action == 'list':
            return  [permission() for permission in permission_classes]


