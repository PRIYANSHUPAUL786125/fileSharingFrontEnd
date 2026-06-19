import axios from "axios";
import { useNavigate } from 'react-router-dom';
axios.defaults.baseURL = 'http://127.0.0.1:3000';
axios.defaults.withCredentials = true;
export  function useLogout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Hit the logout endpoint with credentials enabled
      const res=await axios.post('http://localhost:3000/api/auth/logout', {}, {
        withCredentials: true
      });
      console.log(res.data)

      // 2. Clear any local state or fallback storage if you have it

      // 3. Redirect the user to the login page
      navigate('/login');
      
    } catch (error) {
      console.error("Logout failed:", error.response?.data?.message || error.message);
      
      // Force redirect to login anyway if the session is already dead
      navigate('/login');
    }
  };

  return handleLogout;
}
export const handleGoogleLogin = async () => {
    window.location.href = "http://localhost:3000/api/auth/login";
};
// src/api/api.js

// Create an instance pointing to your backend
// src/api/api.js

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Variables to manage the token refresh queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios.post('http://localhost:3000/api/auth/refresh-token', {}, { withCredentials: true })
          .then((res) => {
            console.log("Token rotated successfully! Processing waiting queue...");
            processQueue(null);
            resolve(API(originalRequest));
          })
          .catch((err) => {
            console.error("Critical refresh failure. Purging queue.");
            processQueue(err, null);
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default API;

const api = axios.create({
    baseURL: "/api",
    withCredentials: true, // send HTTP-only cookies for refresh token
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//     failedQueue.forEach((prom) => {
//         if (error) prom.reject(error);
//         else prom.resolve(token);
//     });
//     failedQueue = [];
// };

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    "/api/auth/refresh-token",
                    {},
                    { withCredentials: true },
                );
                console.log(data);
                const newToken = data.data.accessToken;
                localStorage.setItem("accessToken", newToken);
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = (credentials) =>
    api.get("/auth/login", { params: credentials });

export const logoutUser = () => api.post("/auth/logout");

export const refreshToken = () => api.post("/auth/refresh-token");

export const checkAuth = () => api.get("/auth/check");

// ─── Files ───────────────────────────────────────────────────────────────────

export const uploadFile = (file) => {
    const form = new FormData();
    form.append("myfile", file);
    return api.post("/files", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const downloadFile = (uuid) => api.get(`/files/download/${uuid}`);

export const sendFileEmail = (emailTo, uuid) =>
    api.post("/files/send", { emailTo, uuid });

// export default api;
