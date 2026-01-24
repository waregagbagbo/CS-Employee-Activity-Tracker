import API from "./api";

// list reports
export const listReports = (params) => API.get("api/reports/", { params });

// create reports
export const createReport = (data) => API.post("api/reports/new", data);

// fetch single report
export const getReport = (id) => API.get(`api/reports/${id}/`);

// update a report
export const updateReport = (id, data) => API.put(`api/reports/${id}/`, data);

// approve report
export const approveReport = (id) => API.patch(`api/reports/${id}/approve/`);



