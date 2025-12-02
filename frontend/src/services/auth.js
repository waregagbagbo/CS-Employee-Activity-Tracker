// src/services/auth.js
import API from "./api";

export const loginUser = async (payload) => {
  return await API.post("/", payload);
};

export const logoutUser = async () => {
  return await API.post("auth/logout/");
};

// register

export const registerUser = async (payload) => {
  const res = await API.post("auth/register/",payload)
  return res.data;
};
