import axios from "axios";

// ✅ Get API URL from preload (injected via contextBridge in preload.js)
const API_URL = window.env?.API_URL || "http://192.168.18.69:5001/api";
console.log("🔗 Using API URL:", API_URL);

// ✅ Create Axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60 seconds
    headers: { "Content-Type": "application/json" },
});

// ✅ Request Interceptor → Attach Token
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.warn("⚠️ Failed to read token:", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response Interceptor → Handle Global Errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            console.error(`🚨 API Error [${status}]:`, data);

            // 🔐 Auto logout if unauthorized
            if (status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                if (typeof window !== "undefined" && window.__APP_NAVIGATE__) {
                    window.__APP_NAVIGATE__("/login"); // ✅ SPA navigation
                }
            }
        } else if (error.request) {
            console.error("🌐 Network Error:", error.message);
        } else {
            console.error("⚙️ Axios Config Error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
