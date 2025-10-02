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
import Services from "./pages/Services/index.jsx";
import Invoices from "./pages/Invoice/invoice.jsx";
import { Suppliers } from "./pages/Suppliers/supplier.jsx";
import PartsPurchase from "./pages/PartsPurchase/index.jsx";
import InternalInvoicesPage from "./pages/Invoice/InternalInvoicesPage.jsx";

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
          element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <Login onLogin={handleLogin} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword onForgotPassword={handleForgotPassword} />} />

        {/* Private routes */}
        <Route element={<RequireAuth user={user} />}>
          <Route element={<Shell user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to={getDefaultRoute(user)} replace />} />

            {/* Admin only */}
            <Route element={<RequireAdmin user={user} />}>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
            </Route>

            {/* Role restricted pages */}
            <Route path="/pre-booking" element={<RequireRole user={user} allowed={["admin", "sales", "customer_service"]}><PreBooking /></RequireRole>} />
            <Route path="/car-in" element={<RequireRole user={user} allowed={["admin", "customer_service", "accounts", "parts"]}><CarIn /></RequireRole>} />
            <Route path="/parts-purchase" element={<RequireRole user={user} allowed={["admin", "parts", "accounts"]}><PartsPurchase /></RequireRole>} />
            <Route path="/invoice" element={<RequireRole user={user} allowed={["admin", "accounts"]}><Invoices /></RequireRole>} />
            <Route path="/InternalInvoicesPage" element={<RequireRole user={user} allowed={["admin", "accounts"]}><InternalInvoicesPage /></RequireRole>} />
            <Route path="/suppliers" element={<RequireRole user={user} allowed={["admin"]}><Suppliers /></RequireRole>} />
            <Route path="/services" element={<RequireRole user={user} allowed={["admin"]}><Services /></RequireRole>} />
            <Route path="/register" element={<RequireRole user={user} allowed={["admin"]}><Register onRegister={handleRegister} /></RequireRole>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? getDefaultRoute(user) : "/login"} replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
}

/* Guards */
function RequireAuth({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
function RequireAdmin({ user }) {
  if (!user || user.userType !== "admin") {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }
  return <Outlet />;
}
function RequireRole({ user, allowed, children }) {
  if (!user || !allowed.includes(user.userType)) {
    toast.error("Access denied");
    return <Navigate to={getDefaultRoute(user)} replace />;
  }
  return children;
}

/* Default route per role */
function getDefaultRoute(user) {
  if (!user) return "/login";
  switch (user.userType) {
    case "sales":
      return "/pre-booking";
    case "parts":
      return "/parts-purchase";
    case "accounts":
      return "/car-in";
    case "customer_service":
      return "/pre-booking";
    case "admin":
      return "/dashboard";
    default:
      return "/car-in";
  }
}

/* Shell layout */
function Shell({ user, onLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="hidden md:block w-64 shrink-0">
          <Sidebar
            username={`${user?.username} (${user?.userType ?? "user"})`}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogoutClick}
            userType={user?.userType}
          />
        </aside>
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
        <aside className="relative w-64 h-full bg-white shadow-xl">
          <Sidebar
            username={`${user?.username} (${user?.userType ?? "user"})`}
            onClose={() => setSidebarOpen(false)}
            onLogout={() => {
              setSidebarOpen(false);
              handleLogoutClick();
            }}
            userType={user?.userType}
          />
        </aside>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
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
