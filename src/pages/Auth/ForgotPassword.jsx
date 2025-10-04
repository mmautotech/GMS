// src/pages/Auth/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/api/axiosInstance.js";

export default function ForgotPassword() {
    const [username, setUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    // ✅ Fetch all users for admin dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axiosInstance.get("/auth/users");
                setUsers(res.data?.users || []);
            } catch (err) {
                console.error("❌ Failed to fetch users:", err);
                if (err.response?.status === 401) {
                    toast.error("Session expired. Please log in again.");
                    navigate("/login", { replace: true });
                } else {
                    toast.error(err.response?.data?.error || "Failed to fetch users");
                }
            }
        };
        fetchUsers();
    }, [navigate]);

    // ✅ Submit password reset
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !newPassword) {
            toast.error("Please select a user and enter a new password");
            return;
        }

        setBusy(true);
        try {
            const res = await axiosInstance.post("/auth/admin-change-password", {
                username,
                newPassword,
            });

            toast.success(res.data?.message || "Password updated successfully");
            setUsername("");
            setNewPassword("");
            navigate("/login", { replace: true });
        } catch (err) {
            console.error("❌ Password reset error:", err);
            if (err.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
                navigate("/login", { replace: true });
            } else {
                toast.error(err.response?.data?.error || "Failed to update password");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-6 bg-white shadow rounded">
                {/* 🔙 Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-gray-700 hover:text-gray-900 mb-4"
                >
                    ← Back
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">
                    Reset User Password
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Dropdown */}
                    <div>
                        <label className="block mb-1 font-medium">Select User</label>
                        <select
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                            disabled={busy}
                        >
                            <option value="">-- Select a User --</option>
                            {users.map((user) => (
                                <option key={user._id} value={user.username}>
                                    {user.username} ({user.userType})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block mb-1 font-medium">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                            disabled={busy}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={`w-full text-white p-2 rounded ${busy
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                            }`}
                        disabled={busy}
                    >
                        {busy ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
