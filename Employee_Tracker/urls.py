from django.urls import path
from rest_framework import views
from rest_framework.routers import DefaultRouter
from Employee_Tracker import views

# set the views
urlpatterns =[
    path('',views.EmployeeProfileViewSet.as_view({'get':'list','post':'create'})),
]