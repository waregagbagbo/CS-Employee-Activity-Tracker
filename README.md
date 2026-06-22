## Employee Activity Tracker for Customer Support 

A Django-based system for customer support teams to log end-of-shift reports and provide managers/supervisors with real-time visibility into team activities and performance.
The system also aut-generates a 30day shift schedule for agents,hence reducing the manual allocations.

## Project Structure
- `accounts/` – Custom user model and auth logic
- `shifts/` – Shift tracking and webhook triggers
- `reports/` – End-of-shift reporting and approval flow
- `departments/` – Departments present

## 🚀 Quickstart

1. Clone the repo:

   ```bash
   git clone https://github.com/your-org/employee-activity-tracker.git
   cd employee-activity-tracker

2. Create a virtual environment and install dependencies:
   
   ``` bash
   Linux
   python -m venv env
   source env/bin/activate
   

   Windows
   python -m venv env
   venv\Scripts\activate

3. Install dependencies

   ``` bash
   pip install -r requirements.txt

4. Set up .env and run migrations:

   ``` bash
   python manage.py makemigrations  - schema version control
   python manage.py migrate - Applies changes
   python manage.py auto_assign_shifts.py --days=30 ; auto-generates a 30 day plan in the DB for user.
   

5. Run the server:

   ``` bash
    python manage.py runserver


## API Endpoints

### Authentication
 - POST /login/ - User login
 - POST /auth/register - User register
 - POST /auth/logout/ - User logout
 
### Employee Management (Viewsets)/Generic

Uses a custom AbstractUser model with email as the primary identifier. <br> Signals ensure automatic profile creation and token regeneration on user creation.

 - GET /api/employees/ - List employees (paginated)
 - GET /api/employees/{id}/ - Get employee details
 - PUT /api/employees/{id}/ - Update employee profile
 - GET /api/employees/me/ - Fetches the logged user profile


### Attendance Management (Viewsets)


 - GET /api/attendance/ - List attendance of a user (lists)
 - POST /api/attendance/clock_in - new attendance triggered
 - POST /api/attendance/clok_out/ - time out for the user
 - GET /api/attendance/status/ - Authenticated user gets status
 - GET /api/attendance/today - Captures the day's attendance


### Shift Management (Viewsets)


 - GET /api/shifts/ - List shifts (with filters)
 - POST /api/shifts/ - Create new shift
 - GET /api/shifts/{id}/ - Get shift details
 - PUT/PATCH /shifts/{id}/ - Update shift
 - DELETE /shifts/{id}/ - Delete shift
 - GET /shifts/today/ - Today's shifts
 - GET /shifts/upcoming_shifts/ - Next 7 days shifts
 - PATCH /shifts/{id}/cancel/ - Cancel shift

### Activity Reports (Viewsets)

 - GET /api/reports/ - List reports (with filters)
 - POST /api/reports/ - Submit new report
 - GET /api/reports/{id}/ - Get report details
 - PUT /api/reports/{id}/ - Update report (if not approved)
 - PATCH /api/reports/{id}/approve/ - Approve report (supervisors/managers only)
 - GET /api/reports/export/ - <b> Export reports (CSV)(Future) ONCE VALIDATED with Frontend library</b>


### Webhook Management

Webhooks are triggered on shift status changes (start/end). Implemented using Django signals and dispatched to registered endpoints test(https://webhook.site/). <br> 
Future support for multichannel registry.

## Technical Considerations

### Security
- TokenAuth supported
- Role-based access control (supervisors, agents,admins)
- Input validation and permission checks
- CORS configured for deployment

### Performance
- Database indexing on frequently queried fields (MySQL)
- Pagination via DRF’s `PageNumberPagination` setting
- Throttling to control requests

### Architecture
- Modular design using ViewSets, signals, and custom user models.
- Incorporation of Django management/ commands structure to isolate the auto shift generation
- Webhook dispatch system for real-time notifications on shifts and reports. Testing ground (https://webhook.site/#!/view/a66fc247-bafa-41ce-93af-a408e52ea2b3)


## Development Environment Setup

### Required Tools
 1. Python 3.9+
 2. Django 4.2+
 3. Django REST Framework
 5. MySQL 8.0+
 6. Git
 7. Code editor (PyCharm)
 8. Postman for endpoint testing
 9. React - For Frontend Scaffolding


## SAMPLE Results.

#### DRF Login (use case for SessionAuth) http://127.0.0.1:8000 or http://localhost:3000/

<img width="600" height="800" alt="image" src="https://github.com/waregagbagbo/CS-Employee-Activity-Tracker/blob/760981c5e1532f4d76fc7344a637bd5fb67c7683/Screenshot%202026-06-17%20003839.png" />

#### Authentication and permissions required for the view functionality (http://127.0.0.1:8000/cs/shifts/)

<img width="600" height="800" alt="image" src="https://github.com/waregagbagbo/CS-Employee-Activity-Tracker/blob/e0216f2ede43b0414c12ac7d54d6ea95be07793b/Screenshot%202026-06-17%20004818.png" />

#### Frontend Dashboard

<img width="600" height="800" alt="image" src="https://github.com/waregagbagbo/CS-Employee-Activity-Tracker/blob/7c7938625655e441df2327d0b5b699f1267c9511/Screenshot%202026-06-17%20010116.png" />
<br>




