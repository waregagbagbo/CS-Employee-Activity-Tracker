import API from "../services/api"

export const listEmployees = (params) => API.get("cs/employee/", { params });
export const retrieveEmployee = (id) => API.get(`cs/employee/${id}/`);
export const updateEmployee = (id, data) => API.put(`cs/employee/${id}/`, data);
