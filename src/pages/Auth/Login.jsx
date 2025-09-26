// src/pages/Login.jsx
import React, { useState } from "react";

export default function Login({ onLogin, onRegister, onForgotPassword }) {
    const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");

        let res;
        if (mode === "login") {
            res = await onLogin?.(username.trim(), password);
        } else if (mode === "register") {
            res = await onRegister?.(username.trim(), email.trim(), password);
        } else if (mode === "forgot") {
            res = await onForgotPassword?.(email.trim());
        }

        setBusy(false);
        if (!res?.ok) setError(res?.error || "Something went wrong");
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl font-bold mb-1 text-center">
                    Garage Management System
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    {mode === "login" && "Sign in to continue"}
                    {mode === "register" && "Create a new account"}
                    {mode === "forgot" && "Recover your password"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(mode === "login" || mode === "register") && (
                        <div>
                            <label className="block text-sm mb-1">Username</label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {(mode === "register" || mode === "forgot") && (
                        <div>
                            <label className="block text-sm mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border rounded px-3 py-2"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    )}

                    {(mode === "login" || mode === "register") && (
                        <div>
                            <label className="block text-sm mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border rounded px-3 py-2"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {error && <div className="text-sm text-red-600">{error}</div>}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-60"
                    >
                        {busy
                            ? mode === "login"
                                ? "Signing in…"
                                : mode === "register"
                                    ? "Creating account…"
                                    : "Sending reset link…"
                            : mode === "login"
                                ? "Sign In"
                                : mode === "register"
                                    ? "Create Account"
                                    : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
                    {mode === "login" && (
                        <>
                            <p>
                                <button
                                    onClick={() => setMode("forgot")}
                                    className="text-blue-600 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </p>
                            <p>
                                Don’t have an account?{" "}
                                <button
                                    onClick={() => setMode("register")}
                                    className="text-blue-600 hover:underline"
                                >
                                    Create one
                                </button>
                            </p>
                        </>
                    )}
                    {mode !== "login" && (
                        <p>
                            <button
                                onClick={() => setMode("login")}
                                className="text-blue-600 hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </p>
                    )}
                </div>

                {mode === "login" && (
                    <p className="text-xs text-gray-500 mt-6 text-center">
                        Demo login: <b>admin</b> / <b>admin123</b>
                    </p>
                )}
            </div>
        </div>
    );
}