// src/services/auth.js
import API from "./api";

export const loginUser = async (email, password) => {
  const res = await API.post("auth/login/", { email, password });
  localStorage.setItem("access", res.data.access);
  if (res.data.refresh) localStorage.setItem("refresh", res.data.refresh);
  return res.data;
};

export const logoutUser = async () => {
  try {
    await API.post("auth/logout/");
  } catch (e) {
    // ignore server logout errors
  }
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
};
