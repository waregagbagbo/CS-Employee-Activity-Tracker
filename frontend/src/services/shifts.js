import API from "./api";

// GET ALL
export const listShifts = (params) => API.get("api/shifts/", { params });

// GET DETAIL (The one you need for ShiftDetail)
export const getShift = (id) => API.get(`api/shifts/${id}/`);

// CREATE
export const createShift = (data) => API.post("api/shifts/", data);

// UPDATE (Full update)
export const updateShift = (id, data) => API.put(`api/shifts/${id}/`, data);

// PATCH (Partial updates for starting/ending)
export const startShift = (id) => API.patch(`api/shifts/${id}/start/`);
export const endShift = (id) => API.patch(`api/shifts/${id}/end/`);