import API from "./api";

/**
 * ARCHIVE & REGISTRY LOGIC (Standard ViewSet)
 * These talk to your AttendanceViewSet
 */

// Fetches records. Use params like { ordering: "-clock_in_time" } for Live Logs
export const listAttendance = (params = {}) =>
  API.get("api/attendance/", { params });

export const createAttendance = (data) =>
  API.post("api/attendance/", data);

export const retrieveAttendance = (id) =>
  API.get(`api/attendance/${id}/`);

export const updateAttendance = (id, data) =>
  API.patch(`api/attendance/${id}/`, data);

export const deleteAttendance = (id) =>
  API.delete(`api/attendance/${id}/`);


/**
 * REAL-TIME OPERATIONS (Specialized Endpoints)
 * These talk to your @api_view functions (attendance_status, clock_in, clock_out)
 */

// GET: /api/attendance/status/
export const getAttendanceStatus = () =>
  API.get("api/attendance/status/");

// POST: /api/attendance/clock-in/
export const clockIn = () =>
  API.post("api/attendance/clock-in/");

// POST: /api/attendance/clock-out/
export const clockOut = () =>
  API.post("api/attendance/clock-out/");