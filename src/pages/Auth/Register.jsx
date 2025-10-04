// src/pages/Auth/Register.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("sales");
    const [busy, setBusy] = useState(false);

    const roles = ["admin", "sales", "customer_service", "parts", "accounts"];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setBusy(true);
        try {
            const res = await onRegister(username.trim(), password.trim(), userType);
            if (res.ok) {
                setUsername("");
                setPassword("");
                setUserType("sales");
            } else {
                toast.error(res.error || "Failed to create user");
            }
        } catch (err) {
            console.error("❌ Register error:", err);
            toast.error("Unexpected error occurred");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Create New User</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Username</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                            disabled={busy}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                            disabled={busy}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">User Role</label>
                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            className="w-full p-2 border rounded"
                            disabled={busy}
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className={`w-full p-2 rounded text-white transition ${busy
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        disabled={busy}
                    >
                        {busy ? "Creating..." : "Create User"}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline">
                        Forgot Password?
                    </Link>
                </div>
            </div>
        </div>
    );
}
