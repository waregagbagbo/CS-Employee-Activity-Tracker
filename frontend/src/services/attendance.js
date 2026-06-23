import API from "./api";

export const AttendanceService = {
  /**
   * Fetches active user's attendance log history
   * Mapped to: GET /attendance/
   */
  async getHistory() {
    const response = await API.get("api/attendance/");
    // Handles DRF DefaultRouter list array mappings
    return Array.isArray(response.data) ? response.data : response.data?.results || [];
  },

  /**
   * Action trigger to punch into an allocated shift node
   * Mapped to: POST /attendance/clock_in/ -> Payload: { shift_id }
   */
  async clockIn(shiftId) {
    const response = await API.post("api/attendance/clock_in/", { shift_id: parseInt(shiftId, 10) });
    return response.data;
  },

  /**
   * Action trigger to punch out of an active shift node
   * Mapped to: POST /attendance/clock_out/ -> Payload: { attendance_id }
   */
  async clockOut(attendanceId) {
    const response = await API.post("api/attendance/clock_out/", { attendance_id: parseInt(attendanceId, 10) });
    return response.data;
  }
};
