import API from "../services/api"

export const listEmployees = (params) => API.get("api/employees/", { params });
export const getMyProfile = () => API.get("api/employee/me/");
export const retrieveEmployee = (id) => API.get(`api/employees/${id}/`);
export const updateEmployee = (id, data) => API.put(`api/employees/${id}/`, data);
