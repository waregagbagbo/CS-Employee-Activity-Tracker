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
  //console.log("Login response",res.data.username);

  //const token  = res.data.token || res.data.access;
  // Backend returns { message, token, username }
  if (res.data.token) {
    localStorage.setItem("access", res.data.token);
  }

  if (res.data.username) {
    localStorage.setItem("username", res.data.username);
  }

  if(res.data.id){
    localStorage.setItem("employee_id", res.data.id);
  }

  localStorage.setItem("email", email);

  console.log("✅ Logged in:", res.data.username); // You'll see the username!

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
  localStorage.removeItem("id");
  localStorage.removeItem("email");
  window.location.href = "/";
};

