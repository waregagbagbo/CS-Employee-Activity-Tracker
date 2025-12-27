import API from "../services/api"

export const listEmployees = (params) => API.get("api/employee/", { params });
export const retrieveEmployee = (id) => API.get(`api/employee/${id}/`);
export const updateEmployee = (id, data) => API.put(`api/employee/${id}/`, data);
