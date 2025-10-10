// src/pages/Auth/Register.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react"; // 👁️ import icons

export default function Register({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("sales");
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const roles = ["admin", "sales", "customer_service", "parts", "accounts"];

    // ✅ Refresh on focus or when user comes back from another page
    useEffect(() => {
        const handleFocus = () => {
            // Reset form and state on focus (fresh start)
            setUsername("");
            setPassword("");
            setUserType("sales");
            setShowPassword(false);
        };

        window.addEventListener("focus", handleFocus);

        // Cleanup listener when component unmounts
        return () => {
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // ✅ Also refresh when user navigates to this route
    useEffect(() => {
        setUsername("");
        setPassword("");
        setUserType("sales");
        setShowPassword(false);
    }, [location.pathname]);

    // ✅ Validation Function
    const validateInputs = () => {
        if (!username.trim() || !password.trim()) {
            toast.error("Please fill in all fields");
            return false;
        }

        if (username.trim().length < 3) {
            toast.error("Username must be at least 3 characters long");
            return false;
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username.trim())) {
            toast.error("Username can only contain letters, numbers, and underscores");
            return false;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return false;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
        if (!passwordRegex.test(password)) {
            toast.error("Password must contain at least one letter and one number");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateInputs()) return;

        setBusy(true);
        try {
            const res = await onRegister(username.trim(), password.trim(), userType);
            if (res.ok) {
                toast.success("User created successfully");
                setUsername("");
                setPassword("");
                setUserType("sales");
                navigate("/login"); // ✅ optionally navigate after successful register
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
                    {/* Username */}
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

                    {/* Password */}
                    <div className="relative">
                        <label className="block mb-1 font-medium">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 pr-10 border rounded"
                                required
                                disabled={busy}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
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
                                    {role.charAt(0).toUpperCase() +
                                        role.slice(1).replace("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit button */}
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
