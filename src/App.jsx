// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard/index.jsx";
import PreBooking from "./pages/PreBooking/index.jsx";
import CarIn from "./pages/CarIn/index.jsx";
import Login from "./pages/Auth/Login.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import Register from "./pages/Auth/Register.jsx";
import Settings from "./pages/Settings/index.jsx";
import Entities from "./pages/Entities/index.jsx";
import Invoices from "./pages/Invoice/invoice.jsx";
import { PartsInventory } from "./pages/PartsInventory/parts-inventory.jsx";
import { Suppliers } from "./pages/Suppliers/supplier.jsx";
import PartsPurchase from "./pages/PartsPurchase/partsPurchase.jsx";

import { AuthApi } from "./lib/api/authApi.js";

export default function App() {
  const [user, setUser] = useState(null);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("gms_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Login
  const handleLogin = useCallback(async (username, password) => {
    try {
      const { token, user } = await AuthApi.login(username, password);
      AuthApi.setToken(token);
      sessionStorage.setItem("gms_user", JSON.stringify(user));
      setUser(user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Network error" };
    }
  }, []);

  // Register
  const handleRegister = useCallback(async (username, password, userType) => {
    try {
      await AuthApi.register(username, password, userType);
      toast.success(`User (${userType}) created successfully!`);
      return { ok: true };
    } catch (e) {
      toast.error(e.message || "Failed to create user");
      return { ok: false, error: e.message || "Failed to create user" };
    }
  }, []);

  // Forgot Password
  const handleForgotPassword = useCallback(async (username) => {
    try {
      const res = await AuthApi.forgotPassword(username);
      toast.success(`Reset token: ${res.resetToken}`);
      return { ok: true };
    } catch (e) {
      toast.error(e.message || "Failed to send reset token");
      return { ok: false, error: e.message || "Failed to send reset token" };
    }
  }, []);

  // Logout
  const handleLogout = useCallback(() => {
    AuthApi.clearToken();
    sessionStorage.removeItem("gms_user");
    setUser(null);
  }, []);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword onForgotPassword={handleForgotPassword} />}
        />

        {/* Private routes */}
        <Route element={<RequireAuth user={user} />}>
          <Route element={<Shell user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* All pages accessible, no role restrictions */}
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/pre-booking" element={<PreBooking />} />
            <Route path="/car-in" element={<CarIn />} />
            <Route path="/parts-purchase" element={<PartsPurchase />} />
            <Route path="/parts-inventory" element={<PartsInventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/invoice" element={<Invoices />} />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
}

/* Guard for login only */
function RequireAuth({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function Shell({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        username={`${user?.username} (${user?.userType ?? "user"})`}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogoutClick}
        userType={user?.userType} // Sidebar will control visibility
      />
      <main className="flex-1 p-6">
        {!sidebarOpen && (
          <button
            className="mb-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            onClick={handleSidebarToggle}
          >
            ☰ Menu
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
