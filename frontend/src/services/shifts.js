import API from "./api";

export const listShifts = (params) => API.get("api/shifts/", { params });
export const createShift = (data) => API.post("api/shifts/", data);
//export const getShift = (id) => API.get(`cs/shifts/${id}/`);
export const updateShift = (id, data) => API.put(`api/shifts/${id}/`, data);
export const startShift = (id) => API.patch(`api/shifts/${id}/start/`);
export const endShift = (id) => API.patch(`api/shifts/${id}/end/`);
