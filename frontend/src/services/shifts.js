import API from "./api";
export const listShifts = (params) => API.get("shifts/", { params });
export const createShift = (data) => API.post("shifts/", data);
export const getShift = (id) => API.get(`shifts/${id}/`);
export const updateShift = (id, data) => API.put(`shifts/${id}/`, data);
export const startShift = (id) => API.patch(`shifts/${id}/start/`);
export const endShift = (id) => API.patch(`shifts/${id}/end/`);
