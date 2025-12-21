import API from "./api";

export const listShifts = (params) => API.get("cs/shifts/", { params });
export const createShift = (data) => API.post("cs/shifts/", data);
export const getShift = (id) => API.get(`cs/shifts/${id}/`);
export const updateShift = (id, data) => API.put(`cs/shifts/${id}/`, data);
export const startShift = (id) => API.patch(`cs/shifts/${id}/start/`);
export const endShift = (id) => API.patch(`cs/shifts/${id}/end/`);
