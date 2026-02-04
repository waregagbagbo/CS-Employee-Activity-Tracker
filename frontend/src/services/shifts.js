import API from "./api";

const ShiftService = {
  // ============================================
  // STANDARD CRUD OPERATIONS
  // ============================================

  // GET /api/shifts/ - List all shifts (filtered by user role)
  list: async (params = {}) => {
    const response = await API.get("api/shifts/", { params });
    return response.data;
  },

  // GET /api/shifts/{id}/ - Get shift details
  retrieve: async (id) => {
    const response = await API.get(`api/shifts/${id}/`);
    return response.data;
  },

  // POST /api/shifts/ - Create shift (supervisors only)
  create: async (shiftData) => {
    const response = await API.post("api/shifts/", shiftData);
    return response.data;
  },

  // PUT /api/shifts/{id}/ - Full update
  update: async (id, shiftData) => {
    const response = await API.put(`api/shifts/${id}/`, shiftData);
    return response.data;
  },

  // PATCH /api/shifts/{id}/ - Partial update
  partialUpdate: async (id, shiftData) => {
    const response = await API.patch(`api/shifts/${id}/`, shiftData);
    return response.data;
  },

  // DELETE /api/shifts/{id}/ - Delete shift
  delete: async (id) => {
    const response = await API.delete(`api/shifts/${id}/`);
    return response.data;
  },

  // ============================================
  // CUSTOM ACTIONS
  // ============================================

  // GET /api/shifts/today/ - Today's shifts
  getTodayShifts: async () => {
    const response = await API.get("api/shifts/today/");
    return response.data;
  },

  // GET /api/shifts/upcoming/ - Next 7 days shifts
  getUpcomingShifts: async () => {
    const response = await API.get("api/shifts/upcoming/");
    return response.data;
  },

  // GET /api/shifts/my-shifts/ - Current user's shifts (last 30 days + upcoming)
  getMyShifts: async () => {
    const response = await API.get("api/shifts/my-shifts/");
    return response.data;
  },

  // PATCH /api/shifts/{id}/cancel/ - Cancel shift
  cancelShift: async (id) => {
    const response = await API.patch(`api/shifts/${id}/cancel/`);
    return response.data;
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  // Get shifts by date range (using list with filters)
  getShiftsByDateRange: async (startDate, endDate) => {
    const response = await API.get("api/shifts/", {
      params: {
        shift_date__gte: startDate,
        shift_date__lte: endDate,
      },
    });
    return response.data;
  },

  // Get shifts by status
  getShiftsByStatus: async (status) => {
    const response = await API.get("api/shifts/", {
      params: {
        shift_status: status,
      },
    });
    return response.data;
  },

  // Search shifts
  searchShifts: async (searchQuery) => {
    const response = await API.get("api/shifts/", {
      params: {
        search: searchQuery,
      },
    });
    return response.data;
  },

  // Get shifts with ordering
  getShiftsOrdered: async (orderBy = '-shift_date') => {
    const response = await API.get("api/shifts/", {
      params: {
        ordering: orderBy,
      },
    });
    return response.data;
  },
};

export default ShiftService;