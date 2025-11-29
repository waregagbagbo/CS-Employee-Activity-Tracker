import API from "./api";
export const listEmployees = (params) => API.get("employees/", { params });
export const retrieveEmployee = (id) => API.get(`employees/${id}/`);
export const updateEmployee = (id, data) => API.put(`employees/${id}/`, data);
