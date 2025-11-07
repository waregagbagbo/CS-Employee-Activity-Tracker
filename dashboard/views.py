# dashboard/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib import messages
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from Employee_Tracker.models import Shift,ActivityReport



User = get_user_model() # fetch the CustomUser model

# ============== Authentication Views ==============
def login_view(request):
    """Handle user login"""
    if request.user.is_authenticated:
        return redirect('dashboard:home')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.get_full_name() or user.email}!')
            return redirect('dashboard:home')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'dashboard/login.html')


@login_required
def logout_view(request):
    """Handle user logout"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('dashboard:login')


# ============== Dashboard Home ==============
@login_required
def home(request):
    """Dashboard home with overview stats"""
    user = request.user

    # Total employees
    total_employees = User.objects.filter(is_active=True).count()

    # Today's shifts
    today = timezone.now().date()
    today_shifts = Shift.objects.filter(date=today)
    active_shifts = today_shifts.filter(status='in_progress').count()
    completed_shifts = today_shifts.filter(status='completed').count()

    # Pending reports (for supervisors/managers)
    pending_reports = 0
    if user.role in ['supervisor', 'manager']:
        pending_reports = ActivityReport.objects.filter(approved=False).count()

    # Recent shifts (last 5)
    if user.role == 'agent':
        recent_shifts = Shift.objects.filter(user=user).order_by('-created_at')[:5]
    else:
        recent_shifts = Shift.objects.all().order_by('-created_at')[:5]

    # User's shifts today
    user_shifts_today = today_shifts.filter(user=user)

    context = {
        'total_employees': total_employees,
        'active_shifts': active_shifts,
        'completed_shifts': completed_shifts,
        'pending_reports': pending_reports,
        'recent_shifts': recent_shifts,
        'user_shifts_today': user_shifts_today,
    }

    return render(request, 'dashboard/home.html', context)


# ============== Employee Views ==============
@login_required
def employee_list(request):
    """List all employees"""
    # Only supervisors and managers can see all employees
    if request.user.role not in ['supervisor', 'manager']:
        messages.warning(request, 'You do not have permission to view this page.')
        return redirect('dashboard:home')

    employees = User.objects.filter(is_active=True).order_by('-date_joined')

    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        employees = employees.filter(
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )

    # Filter by role
    role_filter = request.GET.get('role', '')
    if role_filter:
        employees = employees.filter(role=role_filter)

    context = {
        'employees': employees,
        'search_query': search_query,
        'role_filter': role_filter,
    }

    return render(request, 'dashboard/employees.html', context)


@login_required
def employee_detail(request, pk):
    """View employee details"""
    employee = get_object_or_404(User, pk=pk)

    # Agents can only view their own profile
    if request.user.role == 'agent' and request.user != employee:
        messages.warning(request, 'You can only view your own profile.')
        return redirect('dashboard:home')

    # Get employee's shifts and reports
    shifts = Shift.objects.filter(user=employee).order_by('-date')[:10]
    reports = ActivityReport.objects.filter(shift__user=employee).order_by('-created_at')[:10]

    # Stats
    total_shifts = Shift.objects.filter(user=employee).count()
    completed_shifts = Shift.objects.filter(user=employee, status='completed').count()
    total_reports = ActivityReport.objects.filter(shift__user=employee).count()
    approved_reports = ActivityReport.objects.filter(shift__user=employee, approved=True).count()

    context = {
        'employee': employee,
        'shifts': shifts,
        'reports': reports,
        'total_shifts': total_shifts,
        'completed_shifts': completed_shifts,
        'total_reports': total_reports,
        'approved_reports': approved_reports,
    }

    return render(request, 'dashboard/employee_detail.html', context)


# ============== Shift Views ==============
@login_required
def shift_list(request):
    """List shifts"""
    user = request.user

    # Agents see only their shifts
    if user.role == 'agent':
        shifts = Shift.objects.filter(user=user)
    else:
        shifts = Shift.objects.all()

    shifts = shifts.order_by('-date', '-start_time')

    # Filters
    status_filter = request.GET.get('status', '')
    if status_filter:
        shifts = shifts.filter(status=status_filter)

    date_filter = request.GET.get('date', '')
    if date_filter:
        shifts = shifts.filter(date=date_filter)

    context = {
        'shifts': shifts,
        'status_filter': status_filter,
        'date_filter': date_filter,
    }

    return render(request, 'dashboard/shifts.html', context)


@login_required
def shift_detail(request, pk):
    """View shift details"""
    shift = get_object_or_404(Shift, pk=pk)

    # Agents can only view their own shifts
    if request.user.role == 'agent' and request.user != shift.user:
        messages.warning(request, 'You can only view your own shifts.')
        return redirect('dashboard:shift_list')

    # Get related report if exists
    try:
        report = ActivityReport.objects.get(shift=shift)
    except ActivityReport.DoesNotExist:
        report = None

    context = {
        'shift': shift,
        'report': report,
    }

    return render(request, 'dashboard/shift_detail.html', context)


# ============== Report Views ==============
@login_required
def report_list(request):
    """List reports"""
    user = request.user

    # Agents see only their reports
    if user.role == 'agent':
        reports = ActivityReport.objects.filter(shift__user=user)
    else:
        reports = ActivityReport.objects.all()

    reports = reports.order_by('-created_at')

    # Filters
    approved_filter = request.GET.get('approved', '')
    if approved_filter == 'true':
        reports = reports.filter(approved=True)
    elif approved_filter == 'false':
        reports = reports.filter(approved=False)

    context = {
        'reports': reports,
        'approved_filter': approved_filter,
    }

    return render(request, 'dashboard/reports.html', context)


@login_required
def report_detail(request, pk):
    """View report details"""
    report = get_object_or_404(ActivityReport, pk=pk)

    # Agents can only view their own reports
    if request.user.role == 'agent' and request.user != report.shift.user:
        messages.warning(request, 'You can only view your own reports.')
        return redirect('dashboard:report_list')

    context = {
        'report': report,
    }

    return render(request, 'dashboard/report_detail.html', context)


@login_required
def report_approve(request, pk):
    """Approve a report (supervisors/managers only)"""
    if request.user.role not in ['supervisor', 'manager']:
        messages.error(request, 'You do not have permission to approve reports.')
        return redirect('dashboard:report_list')

    report = get_object_or_404(ActivityReport, pk=pk)

    if request.method == 'POST':
        report.approved = True
        report.approved_by = request.user
        report.approved_at = timezone.now()
        report.save()

        messages.success(request, f'Report #{report.id} has been approved.')
        return redirect('dashboard:report_detail', pk=report.id)

    context = {
        'report': report,
    }

    return render(request, 'dashboard/report_approve.html', context)
