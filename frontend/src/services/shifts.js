import API from "./api";

const ShiftService = {
  // ============================================
  // TODAY'S SHIFTS
  // ============================================

  /**
   * GET /api/shifts/today_shifts/
   * Get user's shifts for today
   */
  getTodayShifts: async () => {
    const response = await API.get("api/shifts/today_shifts/");
    return response.data;
  },

  // ============================================
  // UPCOMING SHIFTS
  // ============================================

  /**
   * GET /api/shifts/upcoming_shifts/
   * Get upcoming shifts (next 7 days)
   */
  getUpcomingShifts: async () => {
    const response = await API.get("api/shifts/upcoming_shifts/");
    return response.data;
  },

  /**
   * GET /api/shifts/upcoming_month/
   * Get upcoming shifts for the entire month
   */
  getUpcomingMonthShifts: async (year, month) => {
    const response = await API.get("api/shifts/", {
      params: {
        shift_date__gte: `${year}-${String(month).padStart(2, "0")}-01`,
        shift_date__lte: `${year}-${String(month).padStart(2, "0")}-31`,
        shift_status: "shift_scheduled",
        ordering: "shift_date",
      },
    });
    return response.data;
  },

  // ============================================
  // SHIFT HISTORY
  // ============================================

  /**
   * GET /api/shifts/ with date filters
   * Get past shifts (history)
   */
  getShiftHistory: async (daysBack = 30) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const response = await API.get("api/shifts/", {
      params: {
        shift_date__lte: formatDate(today),
        shift_date__gte: formatDate(pastDate),
        shift_status__in: "shift_completed,shift_incomplete,no_show",
        ordering: "-shift_date",
      },
    });
    return response.data;
  },

  /**
   * Get shifts by date range
   */
  getShiftsByDateRange: async (startDate, endDate) => {
    const response = await API.get("api/shifts/", {
      params: {
        shift_date__gte: startDate,
        shift_date__lte: endDate,
        ordering: "-shift_date",
      },
    });
    return response.data;
  },

  // ============================================
  // STANDARD LIST & FILTER
  // ============================================

  /**
   * GET /api/shifts/ - List all shifts
   * Filtered by user role (employee sees own, supervisor sees team)
   */
  list: async (params = {}) => {
    const response = await API.get("api/shifts/", { params });
    return response.data;
  },

  /**
   * Search shifts by username or status
   */
  search: async (query) => {
    const response = await API.get("api/shifts/", {
      params: { search: query },
    });
    return response.data;
  },

  /**
   * Filter shifts by status
   */
  getByStatus: async (status) => {
    const response = await API.get("api/shifts/", {
      params: { shift_status: status },
    });
    return response.data;
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * GET /api/shifts/{id}/ - Get shift details
   */
  retrieve: async (id) => {
    const response = await API.get(`api/shifts/${id}/`);
    return response.data;
  },

  /**
   * POST /api/shifts/ - Create shift
   */
  create: async (shiftData) => {
    const response = await API.post("api/shifts/", shiftData);
    return response.data;
  },

  /**
   * PUT /api/shifts/{id}/ - Full update
   */
  update: async (id, shiftData) => {
    const response = await API.put(`api/shifts/${id}/`, shiftData);
    return response.data;
  },

  /**
   * PATCH /api/shifts/{id}/ - Partial update
   */
  partialUpdate: async (id, shiftData) => {
    const response = await API.patch(`api/shifts/${id}/`, shiftData);
    return response.data;
  },

  /**
   * DELETE /api/shifts/{id}/ - Delete shift
   */
  delete: async (id) => {
    const response = await API.delete(`api/shifts/${id}/`);
    return response.data;
  },

  // ============================================
  // SHIFT TEMPLATES
  // ============================================

  /**
   * GET /api/static-shifts/ - Get shift templates
   */
  listShiftTemplates: async () => {
    const response = await API.get("api/static-shifts/");
    return response.data;
  },

  /**
   * GET /api/static-shifts/{id}/ - Get shift template details
   */
  getShiftTemplate: async (id) => {
    const response = await API.get(`api/static-shifts/${id}/`);
    return response.data;
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get employee's shifts (alias for list)
   */
  getMyShifts: async () => {
    return ShiftService.list({ ordering: "-shift_date" });
  },

  /**
   * Get shifts by employee (supervisor only)
   */
  getEmployeeShifts: async (employeeId) => {
    const response = await API.get("api/shifts/", {
      params: { shift_agent: employeeId },
    });
    return response.data;
  },

  /**
   * Get all completed shifts
   */
  getCompletedShifts: async () => {
    return ShiftService.getByStatus("shift_completed");
  },

  /**
   * Get all scheduled shifts
   */
  getScheduledShifts: async () => {
    return ShiftService.getByStatus("shift_scheduled");
  },

  /**
   * Get all in-progress shifts
   */
  getInProgressShifts: async () => {
    return ShiftService.getByStatus("shift_in_progress");
  },

  /**
   * Get unassigned shifts (supervisor)
   */
  getUnassignedShifts: async () => {
    const response = await API.get("api/shifts/", {
      params: { shift_agent__isnull: true },
    });
    return response.data;
  },
};

export default ShiftService;