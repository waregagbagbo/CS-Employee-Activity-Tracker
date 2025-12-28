import axios from "axios";

const API = axios.create({
  //baseURL: "http://127.0.0.1:8000/",
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// automatically attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
export default API;
