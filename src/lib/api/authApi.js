// src/lib/api/authApi.js
import axiosInstance from "./axiosInstance.js";

export const AuthApi = {
    // 🔹 Login
    login: async (username, password) => {
        try {
            const res = await axiosInstance.post("/auth/login", { username, password });
            return res.data; // { token, user }
        } catch (err) {
            // Check if server responded with 401 or error message
            if (err.response && err.response.status === 401) {
                throw new Error("Invalid username or password");
            }
            // fallback error
            throw new Error(err.response?.data?.message || "Login failed");
        }
    },

    // 🔹 Register / Admin creates user
    register: async (username, password, userType) => {
        const res = await axiosInstance.post("/auth/register", { username, password, userType });
        return res.data; // { message, user }
    },

    // 🔹 Forgot password (all users)
    forgotPassword: async (username) => {
        const res = await axiosInstance.post("/auth/forgot-password", { username });
        return res.data; // { message, resetToken }
    },

    // 🔹 Get all users (admin only)
    getAllUsers: async () => {
        const res = await axiosInstance.get("/auth/users");
        return res.data; // { users: [...] }
    },

    // 🔹 Admin changes any user's password
    adminChangePassword: async (username, newPassword) => {
        const res = await axiosInstance.post("/auth/admin-change-password", { username, newPassword });
        return res.data; // { message }
    },

    // 🔹 Set token in localStorage
    setToken: (token) => {
        localStorage.setItem("token", token);
    },

    // 🔹 Clear token + user
    clearToken: () => {
        localStorage.clear();
    },
};