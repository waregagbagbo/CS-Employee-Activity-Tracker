from django.contrib.admin.templatetags.admin_list import pagination
from django_filters import filters
from django_filters.rest_framework import DjangoFilterBackend
from pip._vendor.requests.models import Response
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from accounts.models import EmployeeProfile, Department
from .models import Shift, WebHook, WebHookLog, ActivityReport
from .serializers import EmployeeProfileSerializer,ShiftSerializer,DepartmentSerializer,WebHookSerializer,WebHookLogSerializer,ActivityReportSerializer
from rest_framework import viewsets, permissions, authentication
from rest_framework import generics


# Views implemented using generics
class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer
    pagination_class = PageNumberPagination

    # add detail method
    def detail(self, request, pk=None):
        query = EmployeeProfile.objects.all()
        user = get_object_or_404(query,pk=pk)
        serializer = EmployeeProfileSerializer(user)
        return Response(serializer.data)




""" shift view """
class ShiftAPIViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    #filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filter_fields = ['employee']



"""" Department view """

class DepartmentAPIViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

""" WebHook view """
class WebHookViewSet(viewsets.ModelViewSet):
    queryset = WebHook.objects.all()
    serializer_class = WebHookSerializer

class WebHookLogViewSet(viewsets.ModelViewSet):
    queryset = WebHookLog.objects.all()
    serializer_class = WebHookLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [authentication.TokenAuthentication]

""" Activity report view """

class ActivityReportViewSet(viewsets.ModelViewSet):
    queryset = ActivityReport.objects.all()
    serializer_class = ActivityReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [authentication.TokenAuthentication]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'department']




