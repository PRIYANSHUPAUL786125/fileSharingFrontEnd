import axios from "axios";
import backendUrl from "../../constant"
import { useNavigate } from 'react-router-dom';
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;
console.log(backendUrl)
export  function useLogout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Hit the logout endpoint with credentials enabled
      const res=await axios.post(`${backendUrl}/api/auth/logout`, {}, {
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
    window.location.href = `${backendUrl}/api/auth/login`;
};
// src/api/api.js

// Create an instance pointing to your backend
// src/api/api.js

const API = axios.create({
  baseURL: `${backendUrl}/api`,
  withCredentials: true,
});
console.log(API.baseURL)

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
        axios.post(`${backendUrl}/api/auth/refresh-token`, {}, { withCredentials: true })
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

