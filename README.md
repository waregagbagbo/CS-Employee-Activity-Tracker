## Employee Activity Tracker for Customer Support 

A Django-based system for customer support teams to log end-of-shift reports and provide managers/supervisors with real-time visibility into team activities and performance.

## API Endpoints
### Authentication
 - POST /api/auth/login/ - User login
 - POST /api/auth/logout/ - User logout
 - POST /api/auth/refresh/ - Refresh JWT token. Also updates session-based auth tokens for compatibility with the accounts app.

### Employee Management (Viewsets)/Generic

Uses a custom AbstractUser model with email as the primary identifier. <br> Signals ensure automatic profile creation and token regeneration on user creation.

 - GET /api/employees/ - List employees (paginated)
 - GET /api/employees/{id}/ - Get employee details
 - PUT /api/employees/{id}/ - Update employee profile

### Shift Management (Viewsets)


 - GET /api/shifts/ - List shifts (with filters)
 - POST /api/shifts/ - Create new shift
 - GET /api/shifts/{id}/ - Get shift details
 - PUT /api/shifts/{id}/ - Update shift
 - PATCH /api/shifts/{id}/start/ - Start shift
 - PATCH /api/shifts/{id}/end/ - End shift

### Activity Reports (Viewsets)

 - GET /api/reports/ - List reports (with filters)
 - POST /api/reports/ - Submit new report
 - GET /api/reports/{id}/ - Get report details
 - PUT /api/reports/{id}/ - Update report (if not approved)
 - PATCH /api/reports/{id}/approve/ - Approve report (supervisors/managers only)
 - GET /api/reports/export/ - <b> Export reports (CSV)(Future) ONCE VALIDATED with Frontend library</b>
### Webhook Management

Webhooks are triggered on shift status changes (start/end). Implemented using Django signals and dispatched to registered endpoints test(https://webhook.site/). <br> 
Future support for multi-channel registry.

## Technical Considerations

### Security
- JWT, SessionAuth, and TokenAuth supported
- Role-based access control (supervisors, agents)
- Input validation and permission checks
- CORS configured for deployment

### Performance
- Database indexing on frequently queried fields (MySQL)
- Pagination via DRF’s `PageNumberPagination` setting

### Architecture
- Modular design using ViewSets, signals, and custom user models.
- Webhook dispatch system for real-time notifications on shifts and reports. Testing ground (https://webhook.site/#!/view/a66fc247-bafa-41ce-93af-a408e52ea2b3)


## Development Environment Setup

### Required Tools
 1. Python 3.9+
 2. Django 4.2+
 3. Django REST Framework
 5. MySQL 8.0+
 6. Git
 7. Code editor (Pycharm)
 8. Postman for endpoint tests


## SAMPLE Results.

#### DRF Login (use case for SessionAuth) http://127.0.0.1:8000/

<img width="673" height="281" alt="image" src="https://github.com/user-attachments/assets/6c274122-b485-4be7-bf4e-9ccfa064ba7f" />

#### Authentication and permissions required for the view functionality (http://127.0.0.1:8000/cs/shifts/)

<img width="653" height="181" alt="image" src="https://github.com/user-attachments/assets/579fc4c1-8791-44ba-b199-575ee414d39f" />

#### Token Auth in operation

<img width="648" height="302" alt="image" src="https://github.com/user-attachments/assets/104d2465-05d3-4bc0-bf1b-19c98a2d4c26" />
<br>

## 🚀 Quickstart

1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/employee-activity-tracker.git
   cd employee-activity-tracker

2. Create a virtual environment and install dependencies:

python -m venv env
source env/bin/activate
pip install -r requirements.txt

3. - Set up .env and run migrations:

python manage.py makemigrations  - schema version control
python manage.py migrate - Applies changes

4. Run the server:

python manage.py runserver


