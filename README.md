## Employee Activity Tracker for Customer Support 

A system where customer support agents can log end-of-shift reports. Provide managers with visibility into team activities.

## API Endpoints
### Authentication
 - POST /api/auth/login/ - User login
 - POST /api/auth/logout/ - User logout
 - POST /api/auth/refresh/ - Refresh auth-token and SessionAuth- To update it on accounts app

### Employee Management (Viewsets)/Generic

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


