import API from "./api";


const AttendanceService = {

  getStatus: async () => {
    const response = await API.get("api/attendance/status/");
    return response.data;
  },

  // POST /api/attendance/clock-in/
  clockIn: async () => {
    const response = await API.post("api/attendance/clock-in/");
    return response.data;
  },

  // POST /api/attendance/clock-out/
  clockOut: async () => {
    const response = await API.post("api/attendance/clock-out/");
    return response.data;
  },

  // 2. Dashboard Summaries
  // GET /api/attendance/today/
  getTodaySummary: async () => {
    const response = await API.get("api/attendance/today/");
    return response.data;
  },

  // 3. History & Logs (For regular Employees)
  // GET /api/attendance/history/
  getPersonalHistory: async () => {
    const response = await API.get("api/attendance/history/");
    return response.data;
  },

  // 4. Supervisor/Admin Actions
  // GET /api/attendance/team/?date=YYYY-MM-DD
  getTeamAttendance: async (date) => {
    const params = date ? { date } : {};
    const response = await API.get("api/attendance/team/", { params });
    return response.data;
  },

  // Standard CRUD (ModelViewSet defaults)
  // GET /api/attendance/
  list: async () => {
    const response = await API.get("api/attendance/");
    return response.data;
  },

  // GET /api/attendance/{id}/
  retrieve: async (id) => {
    const response = await API.get(`api/attendance/${id}/`);
    return response.data;
  }
};

export default AttendanceService;