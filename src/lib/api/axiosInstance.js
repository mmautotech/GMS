// ./axiosInstance.js
import axios from "axios";

// ✅ Always use API URL from .env
const API_URL = "http://localhost:5000/api";

// ✅ Create Axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 20000, // 20s timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Request interceptor → attach token automatically
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.warn("Token fetch failed:", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response interceptor → global error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            console.error(`API Error [${status}]:`, data);

            // 🔒 Auto logout if unauthorized
            if (status === 401) {
                localStorage.removeItem("token");

                // Prefer SPA navigation if injected, otherwise hard reload
                if (typeof window !== "undefined") {
                    if (window.__APP_NAVIGATE__) {
                        window.__APP_NAVIGATE__("/login");
                    } else {
                        window.location.href = "/login";
                    }
                }
            }
        } else if (error.request) {
            console.error("🌐 Network Error:", error.message);
        } else {
            console.error("Axios Config Error:", error.message);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
