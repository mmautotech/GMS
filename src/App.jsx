import React, { Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { SocketProvider } from "./context/SocketProvider";

// ✅ Components
import Sidebar from "./components/Sidebar.jsx";

// ✅ Hooks
import { useAuth } from "./hooks/useAuth.js";

// ✅ Lazy-loaded Pages
const Dashboard = React.lazy(() => import("./pages/Dashboard/index.jsx"));
const PreBooking = React.lazy(() => import("./pages/PreBooking/index.jsx"));
const CarIn = React.lazy(() => import("./pages/CarIn/index.jsx"));
const Login = React.lazy(() => import("./pages/Auth/Login.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/Auth/ForgotPassword.jsx"));
const Register = React.lazy(() => import("./pages/Auth/Register.jsx"));
const Services = React.lazy(() => import("./pages/Services/index.jsx"));
const Suppliers = React.lazy(() => import("./pages/Suppliers/supplier.jsx"));
const PartsPurchase = React.lazy(() => import("./pages/PartsPurchase/index.jsx"));
const Invoices = React.lazy(() => import("./pages/Invoice/index.jsx"));
const InternalInvoicesPage = React.lazy(() => import("./pages/Invoice/InternalInvoicesPage/index.jsx"));

export default function App() {
  const { user, loading, login, register, forgotPassword, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <SocketProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-gray-500">
            Loading page...
          </div>
        }
      >
        <Routes>
          {/* ---------------- PUBLIC ROUTES ---------------- */}
          <Route
            path="/login"
            element={
              user ? <Navigate to={getDefaultRoute(user)} replace /> : <Login onLogin={login} />
            }
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword onForgotPassword={forgotPassword} />}
          />

          {/* ---------------- PRIVATE ROUTES ---------------- */}
          <Route element={<RequireAuth user={user} />}>
            <Route element={<Shell user={user} onLogout={logout} />}>
              <Route index element={<Navigate to={getDefaultRoute(user)} replace />} />

              {/* Admin only */}
              <Route element={<RequireAdmin user={user} />}>
                <Route path="/dashboard" element={<Dashboard user={user} />} />
              </Route>

              {/* Role restricted */}
              <Route
                path="/pre-booking"
                element={
                  <RequireRole user={user} allowed={["admin", "sales", "customer_service"]}>
                    <PreBooking user={user} />
                  </RequireRole>
                }
              />
              <Route
                path="/car-in"
                element={
                  <RequireRole user={user} allowed={["admin", "customer_service", "accounts", "parts"]}>
                    <CarIn currentUser={user} />
                  </RequireRole>
                }
              />
              <Route
                path="/parts-purchase"
                element={
                  <RequireRole user={user} allowed={["admin", "parts", "accounts"]}>
                    <PartsPurchase />
                  </RequireRole>
                }
              />
              <Route
                path="/invoice"
                element={
                  <RequireRole user={user} allowed={["admin", "accounts"]}>
                    <Invoices />
                  </RequireRole>
                }
              />
              <Route
                path="/InternalInvoicesPage"
                element={
                  <RequireRole user={user} allowed={["admin", "accounts"]}>
                    <InternalInvoicesPage />
                  </RequireRole>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <RequireRole user={user} allowed={["admin"]}>
                    <Suppliers />
                  </RequireRole>
                }
              />
              <Route
                path="/services"
                element={
                  <RequireRole user={user} allowed={["admin"]}>
                    <Services />
                  </RequireRole>
                }
              />
              <Route
                path="/register"
                element={
                  <RequireRole user={user} allowed={["admin"]}>
                    <Register onRegister={register} />
                  </RequireRole>
                }
              />
            </Route>
          </Route>

          {/* ---------------- FALLBACK ---------------- */}
          <Route
            path="*"
            element={<Navigate to={user ? getDefaultRoute(user) : "/login"} replace />}
          />
        </Routes>
      </Suspense>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </SocketProvider>
  );
}

/* 🔒 Route Guards */
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

/* 🧭 Role-Based Default Routes */
function getDefaultRoute(user) {
  if (!user) return "/login";
  switch (user.userType) {
    case "sales":
      return "/pre-booking";
    case "parts":
      return "/parts-purchase";
    case "accounts":
      return "/invoice";
    case "customer_service":
      return "/pre-booking";
    case "admin":
      return "/dashboard";
    default:
      return "/car-in";
  }
}

/* 🧩 Shell Layout */
function Shell({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  // 🔹 Hide Sidebar and Menu button on Login / Forgot Password pages
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/forgot-password";

  if (isAuthPage) return <Outlet />;

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar (Animated) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="w-64 shrink-0 fixed md:relative z-50 bg-white shadow-lg h-full"
          >
            <Sidebar
              username={`${user?.username} (${user?.userType ?? "user"})`}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogoutClick}
              userType={user?.userType}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ☰ Floating Menu Icon (Visible when Sidebar closed) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            key="menu-button"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 rounded shadow-lg hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰ Menu
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? "ml-64 md:ml-0" : "ml-0"
          } p-4 md:p-6`}
      >
        <Outlet />
      </main>
    </div>
  );
}
