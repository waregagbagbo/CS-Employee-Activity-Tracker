import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api/",
  withCredentials: true, // if backend uses session cookies alongside JWT
});

/* Request interceptor: attach access token */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* Response interceptor: attempt refresh on 401 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalRequest = err.config;

    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        isRefreshing = false;
        return Promise.reject(err);
      }

      return new Promise(function (resolve, reject) {
        axios
          .post((process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/") + "api/auth/refresh/", {
            refresh,
          })
          .then(({ data }) => {
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh || refresh);
            API.defaults.headers.common.Authorization = "Bearer " + data.access;
            originalRequest.headers.Authorization = "Bearer " + data.access;
            processQueue(null, data.access);
            resolve(API(originalRequest));
          })
          .catch((err2) => {
            processQueue(err2, null);
            reject(err2);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(err);
  }
);

export default API;
