// src/services/dashboard.js
import API from "./api";

export const getDashboardStats = async () => {
  const res = await API.get("/cs/employee/"); // create this endpoint in DRF
  return res.data;
};
