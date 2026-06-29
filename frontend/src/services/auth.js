// src/services/auth.js
import API from "../services/api";


// register authentication
export const registerUser = async (payload) => {
  const res = await API.post("auth/register/",payload)
  return res.data;
};


// login authentication
export const loginUser = async (email, password) => {
  const res = await API.post("", { email, password });

  if (res.data.token) {
    localStorage.setItem("access", res.data.token);
  }

  if (res.data.username) {
    localStorage.setItem("username", res.data.username);
  }

  if (res.data.id) {
    localStorage.setItem("employee_id", res.data.id);
  }

  if (res.data.user_type) {
  localStorage.setItem("user_type", res.data.user_type);
}

  localStorage.setItem("email", email);

  console.log("✅ Logged in:", res.data.username);

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
  localStorage.removeItem("username");
  localStorage.removeItem("employee_id"); // Fixed: matches your login key
  localStorage.removeItem("email");
  localStorage.removeItem("user_type");    // ADDED: Clears user type on logout
  window.location.href = "/";
};


