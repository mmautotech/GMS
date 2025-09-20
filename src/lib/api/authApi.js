// src/lib/api/authApi.js
import axiosInstance from "./axiosInstance.js";

export const AuthApi = {
    // 🔹 Login
    login: async (username, password) => {
        const res = await axiosInstance.post("/auth/login", { username, password });
        return res.data; // { token, user }
    },

    // 🔹 Register / Admin creates user
    register: async (username, password, userType) => {
        const res = await axiosInstance.post("/auth/register", { username, password, userType });
        return res.data; // { message, user }
    },

    // 🔹 Forgot password (all users)
    forgotPassword: async (username) => {
        const res = await axiosInstance.post("/auth/forgot-password", { username });
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
