import API from "./api";


// LIST (role-filtered automatically by backend)
export const listReports = (params) =>
  API.get("/api/reports/", { params });

// RETRIEVE
export const getReport = (id) =>
  API.get(`/api/reports/${id}/`);

// CREATE (uses ActivityReportCreateSerializer)
export const createReport = (data) =>
  API.post("/api/reports/", data);

// UPDATE (employee edits before approval)
export const updateReport = (id, data) =>
  API.patch(`/api/reports/${id}/`, data);

// DELETE
export const deleteReport = (id) =>
  API.delete(`/api/reports/${id}/`);

// APPROVE (Supervisor/Admin only)
export const approveReport = (id) =>
  API.post(`/api/reports/${id}/approve/`);

