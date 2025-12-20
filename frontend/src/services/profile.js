import API from '../services/api'

// create the profile id fetcher
export const retrieveProfile = (id) => API.get(`cs/employee/${id}/`);
export const updateProfile = (id, data) => API.patch(`cs/employee/${id}`, data);