// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");

        try {
            const res = await onLogin?.(username.trim(), password.trim());
            if (!res?.ok) {
                setError(res?.error || "Invalid username or password");
            }
        } catch (err) {
            console.error("❌ Login failed:", err);
            setError("Unexpected error occurred");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl font-bold mb-1 text-center">
                    Garage Management System
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Sign in to continue
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm mb-1">Username</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full border rounded px-3 py-2 pr-10"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 top-7 flex items-center px-1 text-gray-600"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Error */}
                    {error && <div className="text-sm text-red-600">{error}</div>}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-60"
                    >
                        {busy ? "Signing in…" : "Sign In"}
                    </button>
                </form>



                <p className="text-xs text-gray-500 mt-6 text-center">
                    Demo login: <b>admin</b> / <b>admin123</b>
                </p>
            </div>
        </div>
    );
}
