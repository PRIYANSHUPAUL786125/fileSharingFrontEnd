import axios from "axios";
import { useNavigate } from 'react-router-dom';

// 🔑 Global config for any raw axios calls
axios.defaults.withCredentials = true;

// 🌟 THE CENTRAL PROXIED INSTANCE
// baseURL "/api" → Vercel proxy → Render backend (same-origin, cookies work)
const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ─── Token Refresh Queue ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        API.post('/auth/refresh-token', {})
          .then(() => {
            console.log("Token rotated successfully! Processing waiting queue...");
            processQueue(null);
            resolve(API(originalRequest));
          })
          .catch((err) => {
            console.error("Critical refresh failure. Purging queue.");
            processQueue(err);
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

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export function useLogout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await API.post('/auth/logout', {});
      console.log(res.data);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error.response?.data?.message || error.message);
      navigate('/login');
    }
  };

  return handleLogout;
}

export const handleGoogleLogin = () => {
  // Hits Vercel proxy → Render /api/auth/login → Google OAuth
  window.location.href = "/api/auth/login";
};

export default API;
