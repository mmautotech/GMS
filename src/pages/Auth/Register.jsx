import React, { useState } from "react";
import { toast } from "react-toastify";

export default function Register({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("sales"); // default role
    const [busy, setBusy] = useState(false);

    const roles = ["admin", "sales", "customer_service", "parts", "accounts"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);

        const res = await onRegister(username, password, userType);
        setBusy(false);

        if (res.ok) {
            toast.success(`User (${userType}) created successfully!`);
            // Clear form for next user
            setUsername("");
            setPassword("");
            setUserType("sales");
        } else {
            toast.error(res.error || "Failed to create user");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
                <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    {roles.map((role) => (
                        <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    disabled={busy}
                >
                    {busy ? "Creating..." : "Create User"}
                </button>
            </form>
        </div>
    );
}
