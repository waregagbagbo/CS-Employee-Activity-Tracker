import API from "./api";
export const listReports = (params) => API.get("api/reports/", { params });
export const createReport = (data) => API.post("reports/", data);
export const getReport = (id) => API.get(`reports/${id}/`);
export const updateReport = (id, data) => API.put(`reports/${id}/`, data);
export const approveReport = (id) => API.patch(`reports/${id}/approve/`);
