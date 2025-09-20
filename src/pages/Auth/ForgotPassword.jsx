import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword({ onForgotPassword }) {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSuccess("");
        const res = await onForgotPassword?.(email.trim());
        setBusy(false);

        if (!res?.ok) setError(res?.error || "Failed to send reset link");
        else setSuccess("Reset link sent! Check your inbox.");
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl font-bold mb-1 text-center">Forgot Password</h1>
                <p className="text-center text-gray-500 mb-6">
                    Enter your email to reset your password
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded px-3 py-2"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && <div className="text-sm text-red-600">{error}</div>}
                    {success && <div className="text-sm text-green-600">{success}</div>}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full bg-gray-900 text-white rounded py-2 hover:bg-gray-800 disabled:opacity-60"
                    >
                        {busy ? "Sending…" : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Back to Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
