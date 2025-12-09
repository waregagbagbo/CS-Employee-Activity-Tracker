// src/services/auth.js
import API from "../services/api";


// register authentication
export const registerUser = async (payload) => {
  const res = await API.post("auth/register/",payload)
  return res.data;
};


// login authentication
export const loginUser = async (email, password) => {
  const res = await API.post("/", { email, password });
  // backend returns { message, token }
  localStorage.setItem("access", res.data.token);
  return res.data;
};


// logout authentication
export const logoutUser = async () => {
  try {
    await API.post("auth/logout/");
  } catch (e) {
    // ignore server logout errors
  }
  localStorage.removeItem("access");
  window.location.href = "/";
};

