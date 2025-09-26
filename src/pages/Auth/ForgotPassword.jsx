// src/pages/Auth/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../../lib/api/authApi.js";

export default function ForgotPassword() {
    const [username, setUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [users, setUsers] = useState([]);

    const navigate = useNavigate();

    // Fetch all users for dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await AuthApi.getAllUsers(); // API returns { users: [...] }
                setUsers(res.users || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch users");
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !newPassword) {
            return toast.error("Please select a user and enter a new password");
        }

        setBusy(true);
        try {
            // Call API to reset password
            const res = await AuthApi.adminChangePassword(username, newPassword);
            toast.success(res.message || "Password updated successfully");
            setUsername("");
            setNewPassword("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to update password");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-6 bg-white shadow rounded">
                {/* Back arrow */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-gray-700 hover:text-gray-900 mb-4"
                >
                    ← Back
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                        disabled={busy}
                    />

                    <button
                        type="submit"
                        className={`w-full ${busy ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"} text-white p-2 rounded`}
                        disabled={busy}
                    >
                        {busy ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}