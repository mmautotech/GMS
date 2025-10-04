import axiosInstance from "./axiosInstance.js";

export const AuthApi = {
    /** 🔹 Login */
    login: async (username, password) => {
        try {
            const res = await axiosInstance.post("/auth/login", { username, password });
            const data = res.data;

            if (data?.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            return data; // { token, user }
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.error ||
                err.message ||
                "Login failed";
            throw new Error(message);
        }
    },

    /** 🔹 Register (Admin only) */
    register: async (username, password, userType) => {
        try {
            const res = await axiosInstance.post("/auth/register", { username, password, userType });
            return res.data;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.error ||
                err.message ||
                "Registration failed";
            throw new Error(message);
        }
    },

    /** 🔹 Forgot Password */
    forgotPassword: async (username) => {
        try {
            const res = await axiosInstance.post("/auth/forgot-password", { username });
            return res.data;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.error ||
                err.message ||
                "Password reset failed";
            throw new Error(message);
        }
    },

    /** 🔹 Utility */
    setToken: (token) => token && localStorage.setItem("token", token),
    getToken: () => localStorage.getItem("token"),
    clearSession: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    /** 🔹 Logout Helper */
    logout: () => {
        AuthApi.clearSession();
        if (typeof window !== "undefined" && window.__APP_NAVIGATE__) {
            window.__APP_NAVIGATE__("/login");
        }
    },
};
