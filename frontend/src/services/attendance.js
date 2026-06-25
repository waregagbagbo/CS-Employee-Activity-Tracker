import API from "./api";

const AttendanceService = {
  // GET current user's status
  getStatus: async () => {
    const response = await API.get("/api/attendance/status/");
    return response.data;
  },

  // POST /api/attendance/clock_in/ - Clock in with shift validation
  clockIn: async (data) => {
    const response = await API.post("/api/attendance/clock_in/", data);
    return response.data;
  },

  // POST /api/attendance/clock_out/ - Clock out with duration validation
  clockOut: async (data = {}) => {
    const response = await API.post("/api/attendance/clock_out/", data);
    return response.data;
  },

  // GET /api/attendance/today/ - Today's summary
  getTodaySummary: async () => {
    const response = await API.get("/api/attendance/today/");
    return response.data;
  },

  // GET /api/attendance/history/ - Personal attendance history
  getPersonalHistory: async (params = {}) => {
    const response = await API.get("/api/attendance/history/", { params });
    return response.data;
  },

  // GET /api/attendance/team/ - Team attendance (supervisors only)
  getTeamAttendance: async (date = null) => {
    const params = date ? { date } : {};
    const response = await API.get("/api/attendance/team/", { params });
    return response.data;
  },

  // GET /api/attendance/ - List all attendance records
  list: async (params = {}) => {
    const response = await API.get("/api/attendance/", { params });
    return response.data;
  },

  // GET /api/attendance/{id}/ - Get single attendance record
  retrieve: async (id) => {
    const response = await API.get(`/api/attendance/${id}/`);
    return response.data;
  },
};

export default AttendanceService;