import API from "./api";

export const listDepartments = (params) => API.get("api/departments/", { params });
export const retrieveDepartment = (id) => API.get(`api/departments/${id}/`);