import API from "./api";

export const ShiftService = {
  async getShifts(page = 1, search = "") {
    const queryParams = new URLSearchParams({ page });
    if (search) queryParams.append("search", search);

    const response = await API.get(`api/shifts/?${queryParams.toString()}`);
    return {
      results: response.data?.results || [],
      hasNext: !!response.data?.next,
      hasPrev: !!response.data?.previous,
    };
  },

  async getTodayShifts() {
    const response = await API.get("api/shifts/today_shifts/");
    return Array.isArray(response.data) ? response.data : response.data?.results || [];
  },

  async getUpcomingShifts() {
    const response = await API.get("api/shifts/upcoming_shifts");
    return Array.isArray(response.data) ? response.data : response.data?.results || [];
  },
};
