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
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ForgotPassword onForgotPassword={handleForgotPassword} />
            )
          }
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

/**
 * Shell layout:
 * - Desktop (md+): sidebar is controlled by `sidebarOpen` and shown inline when true.
 * - Mobile (<md): sidebar is a slide-in drawer using the same `sidebarOpen` state.
 * - Main uses `min-w-0 overflow-x-hidden` so tables/content can't push the layout wider.
 */
function Shell({ user, onLogout }) {
  const navigate = useNavigate();

  // Open by default on desktop (>=768px), closed on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  // If resized to desktop width, ensure the sidebar opens
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* --- Desktop sidebar (md+) — controlled by sidebarOpen --- */}
      {sidebarOpen && (
        <aside className="hidden md:block w-64 shrink-0">
          <Sidebar
            username={`${user?.username} (${user?.userType ?? "user"})`}
            onClose={() => setSidebarOpen(false)}  // ✅ close on ❌
            onLogout={handleLogoutClick}
            userType={user?.userType}
          />
        </aside>
      )}

      {/* --- Mobile drawer (smaller than md) — same state --- */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        aria-hidden={!sidebarOpen}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
        {/* Drawer */}
        <aside className="relative w-64 h-full bg-white shadow-xl">
          <Sidebar
            username={`${user?.username} (${user?.userType ?? "user"})`}
            onClose={() => setSidebarOpen(false)}  // ✅ close on ❌
            onLogout={() => {
              setSidebarOpen(false);
              handleLogoutClick();
            }}
            userType={user?.userType}
          />
        </aside>
      </div>

      {/* --- Main content --- */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {/* Menu button: visible when sidebar is closed OR on mobile */}
          <button
            className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰ Menu
          </button>

          {/* Optional: show a desktop menu button when closed on md+ */}
          {!sidebarOpen && (
            <button
              className="hidden md:inline-flex bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰ Menu
            </button>
          )}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
