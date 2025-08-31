## Employee Activity Tracker for Customer Support 

A system where customer support agents can log end-of-shift reports. Provide managers with visibility into team activities.

## API Endpoints
### Authentication
 - POST /api/auth/login/ - User login
 - POST /api/auth/logout/ - User logout
 - POST /api/auth/refresh/ - Refresh auth-token and SessionAuth- To update it on accounts app

### Employee Management (Viewsets)/Generic

I implemented Abstract User setup. Email has been used in place of username as a key requirement. Signals have been enabled <br/>
to ensure automatic profile creation alongside auth-token regenerated.

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
 - GET /api/reports/export/ - <b> Export reports (CSV)(Future)</b>
### Webhook Management

 - GET /api/webhooks/ - List webhook configurations
 - POST /api/webhooks/ - Create webhook
 - PUT /api/webhooks/{id}/ - Update webhook
 - DELETE /api/webhooks/{id}/ - Delete webhook

## Technical Considerations

### Security
 1. JWT token authentication / SessionAuth /Auth-Token
 2. Role-based permissions (supervisors and shift-agents)
 3. Input validation and sanitization (Permissions)
 4. CORS configuration (During deployment)
 5. Performance (caching and the rest from research)
 6. Database indexing on frequently queried fields (MYSQL)
 7. Pagination for large datasets * DRF Paginator *

## Development Environment Setup

### Required Tools
 1. Python 3.9+
 2. Django 4.2+
 3. Django REST Framework
 5. MySQL 8.0+
 6. Git
 7. Code editor (Pyacharm)


## SAMPLE Results.
