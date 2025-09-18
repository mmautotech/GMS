// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard/index.jsx";
import PreBooking from "./pages/PreBooking/index.jsx";
import CarIn from "./pages/CarIn/index.jsx";
import Login from "./pages/Login.jsx";
import Settings from "./pages/Settings/index.jsx";
import Entities from "./pages/Entities/index.jsx";
import Invoices from "./pages/Invoice/invoice.jsx";
import { PartsInventory } from "./pages/PartsInventory/parts-inventory.jsx";
import { Suppliers } from "./pages/Suppliers/supplier.jsx";
import PartsPurchase from "./pages/PartsPurchase/partsPurchase.jsx";


// ✅ Import AuthApi only
import { AuthApi } from "./lib/api/authApi.js";

export default function App() {
  const [user, setUser] = useState(null);

  // Restore session on page load
  useEffect(() => {
    const saved = localStorage.getItem("gms_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Login handler
  const handleLogin = useCallback(async (username, password) => {
    try {
      const { token, user } = await AuthApi.login(username, password);

      AuthApi.setToken(token);
      localStorage.setItem("gms_user", JSON.stringify(user));

      setUser(user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Network error" };
    }
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    AuthApi.clearToken();
    localStorage.removeItem("gms_user");
    setUser(null);
  }, []);

  return (
    <>
      <Routes>
        {/* Public route: login */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          }
        />

        {/* Private routes (require login) */}
        <Route element={<RequireAuth user={user} />}>
          <Route element={<Shell user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/pre-booking" element={<PreBooking />} />
            <Route path="/car-in" element={<CarIn />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="/invoice" element={<Invoices />} />
            <Route path="/parts-inventory" element={<PartsInventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/PartsPurchase" element={<PartsPurchase />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>

      {/* Toast container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
}

/* Guards + Layout */
function RequireAuth({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function Shell({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <Sidebar
          username={`${user?.username} (${user?.userType ?? "user"})`}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogoutClick}
        />
      )}
      <main className="flex-1 p-6">
        {!sidebarOpen && (
          <button
            className="mb-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Menu
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
