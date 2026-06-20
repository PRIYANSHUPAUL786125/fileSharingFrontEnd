import axios from "axios";
import { useNavigate } from "react-router-dom";
// 🔑 Global config for any raw axios calls
axios.defaults.withCredentials = true;
// 🌟 THE CENTRAL PROXIED INSTANCE
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
        // 🛑 1. EJECT IMMEDIATELY IF IT'S THE REFRESH ENDPOINT FAILING
        // This stops the infinite loop dead in its tracks.
        if (originalRequest.url.includes("/auth/refresh-token")) {
            return Promise.reject(error);
        }
        // 2. Handle 401s for all other endpoints
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
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
                API.post("/auth/refresh-token", {})
                    .then(() => {
                        console.log(
                            "Token rotated successfully! Processing waiting queue...",
                        );
                        processQueue(null);
                        resolve(API(originalRequest));
                    })
                    .catch((err) => {
                        console.error(
                            "Critical refresh failure. Purging queue and redirecting.",
                        );
                        processQueue(err);

                        // 💡 Pro-tip: Clear your local auth state here if needed
                        // (e.g., localStorage.clear() or dispatch a logout action)

                        reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            });
        }
        return Promise.reject(error);
    },
);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export function useLogout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const res = await API.post("/auth/logout", {});
            console.log(res.data);
            navigate("/login");
        } catch (error) {
            console.error(
                "Logout failed:",
                error.response?.data?.message || error.message,
            );
            navigate("/login");
        }
    };

    return handleLogout;
}

export const handleGoogleLogin = () => {
    // Hits Vercel proxy → Render /api/auth/login → Google OAuth
    window.location.href =
        "https://api-file-sharing-test.onrender.com/api/auth/login";
};

export default API;
