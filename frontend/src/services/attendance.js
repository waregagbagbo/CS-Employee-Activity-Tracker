import API from "./api";

/**
 * List attendance records
 */
export const listAttendance = (params = {}) =>
  API.get("api/attendance/", { params });

/**
 * Create attendance record
 */
export const createAttendance = (data) =>
  API.post("api/attendance/", data);

/**
 * Retrieve single attendance
 */
export const retrieveAttendance = (id) =>
  API.get(`api/attendance/${id}/`);

/**
 * Update attendance
 */
export const updateAttendance = (id, data) =>
  API.patch(`api/attendance/${id}/`, data);

/**
 * Delete attendance (Admin only)
 */
export const deleteAttendance = (id) =>
  API.delete(`api/attendance/${id}/`);
