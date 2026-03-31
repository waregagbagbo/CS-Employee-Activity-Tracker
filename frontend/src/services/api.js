import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL ||  "http://127.0.0.1:8000", // Fallback
});

// automatically attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
API.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (error.response?.status === 429 && !config._retried) {
      config._retried = true;
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return API(config);
    }
    return Promise.reject(error);
  }
);
export default API;
