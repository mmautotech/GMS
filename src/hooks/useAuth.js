// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { AuthApi } from "../lib/api/authApi.js";
import { AuthMemory } from "../lib/authMemory.js";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /** 🔹 Clear any old session on app start */
    useEffect(() => {
        AuthMemory.clearSession();
        setLoading(false);

        // 🔹 Clear session when app closes or reloads
        const handleUnload = () => AuthMemory.clearSession();
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, []);

    /** 🔹 Login */
    const login = useCallback(async (username, password) => {
        try {
            const { token, user } = await AuthApi.login(username, password);
            setUser(user);
            toast.success(`Welcome back, ${user.username}!`);
            return { ok: true };
        } catch (e) {
            toast.error(e.message || "Invalid username or password");
            return { ok: false, error: e.message || "Invalid username or password" };
        }
    }, []);

    /** 🔹 Logout */
    const logout = useCallback(async () => {
        await AuthApi.logout();
        AuthMemory.clearSession();
        setUser(null);
        toast.info("You have been logged out");
    }, []);

    /** 🔹 Register */
    const register = useCallback(async (username, password, userType) => {
        try {
            await AuthApi.register(username, password, userType);
            toast.success(`User (${userType}) created successfully!`);
            return { ok: true };
        } catch (e) {
            toast.error(e.message || "Failed to create user");
            return { ok: false, error: e.message || "Failed to create user" };
        }
    }, []);

    /** 🔹 Forgot Password */
    const forgotPassword = useCallback(async (username) => {
        try {
            const res = await AuthApi.forgotPassword(username);
            toast.success(`Reset token: ${res.resetToken}`);
            return { ok: true };
        } catch (e) {
            toast.error(e.message || "Failed to send reset token");
            return { ok: false, error: e.message || "Failed to send reset token" };
        }
    }, []);

    return { user, loading, login, register, forgotPassword, logout };
}
