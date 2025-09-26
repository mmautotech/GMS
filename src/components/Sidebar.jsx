// src/components/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Car,
  FileText,
  Package,
  Settings,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Sidebar({ onClose, onLogout, username, userType }) {
  const [openDropdown, setOpenDropdown] = useState(null); // track open submenu

  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm font-medium
     ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`;

  // Define pages for each role
  const pages = {
    admin: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "PreBooking", path: "/pre-booking", icon: Calendar },
      { name: "Car In", path: "/car-in", icon: Car },
      { name: "Parts Purchase", path: "/parts-purchase", icon: Users },

      {
        name: "Invoices",
        path: "/invoice",
        icon: FileText,
        submenu: [
          { name: "Main Invoice", path: "/invoice" },
          { name: "Internal Invoice", path: "/InternalInvoicesPage" },
        ],
      },
      { name: "Suppliers", path: "/suppliers", icon: Users },
      { name: "Services", path: "/entities", icon: Settings },
      { name: "Register", path: "/register", icon: Users },
    ],



    sales: [
      { name: "PreBooking", path: "/pre-booking", icon: Calendar },
    ],


    customer_service: [

      { name: "PreBooking", path: "/pre-booking", icon: Calendar },
      { name: "Car In", path: "/car-in", icon: Car },
    ],


    parts: [

      { name: "Parts Purchase", path: "/parts-purchase", icon: Users },

    ],


    accounts: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      {
        name: "Invoices",
        path: "/invoice",
        icon: FileText,
        submenu: [
          { name: "Main Invoice", path: "/invoice" },
          { name: "Internal Invoice", path: "/InternalInvoicesPage" },
        ],
      },
    ],
  };

  const userPages = pages[userType] || [];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 h-full bg-white text-gray-800 shadow-md flex flex-col fixed top-0 left-0">
        {/* Logo / Title */}
        <div className="p-5 text-xl font-bold text-blue-700 border-b border-gray-200 flex justify-between items-center">
          Garage Management
          <button
            className="text-gray-500 hover:text-red-500"
            onClick={onClose}
            title="Hide sidebar"
          >
            ✖
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-3 text-sm text-gray-500 border-b border-gray-200">
          Signed in as <span className="text-gray-800 font-semibold">{username}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {userPages.map((page) => {
              const Icon = page.icon;

              if (page.submenu) {
                return (
                  <li key={page.path} className="relative">
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition text-gray-700 hover:bg-blue-50 hover:text-blue-600`}
                      onClick={() =>
                        setOpenDropdown(openDropdown === page.name ? null : page.name)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} /> {page.name}
                      </div>
                      {openDropdown === page.name ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    {/* Submenu */}
                    {openDropdown === page.name && (
                      <ul className="mt-1 pl-6 space-y-1">
                        {page.submenu.map((sub) => (
                          <li key={sub.path}>
                            <NavLink
                              to={sub.path}
                              className="block px-4 py-2 text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600"
                            >
                              {sub.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={page.path}>
                  <NavLink to={page.path} className={itemClass}>
                    <Icon size={18} /> {page.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Page Content */}
      <main className="flex-1 ml-64 h-full overflow-y-auto bg-gray-50 p-6"></main>
    </div>
  );
}