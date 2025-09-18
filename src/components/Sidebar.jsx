import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Car,
  FileText,
  Package,
  Settings,
  Users,
} from "lucide-react";

export default function Sidebar({ onClose, onLogout, username }) {
  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm font-medium
     ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`;

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
            <li>
              <NavLink to="/dashboard" className={itemClass}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/pre-booking" className={itemClass}>
                <Calendar size={18} /> Prebooking
              </NavLink>
            </li>
            <li>
              <NavLink to="/car-in" className={itemClass}>
                <Car size={18} /> Car In
              </NavLink>
            </li>
            <li>
              <NavLink to="/invoice" className={itemClass}>
                <FileText size={18} /> Invoices
              </NavLink>
            </li>
            <li>
              <NavLink to="/PartsPurchase" className={itemClass}>
                <Users size={18} /> PartsPurchase
              </NavLink>
            </li>
            <li>
              <NavLink to="/parts-inventory" className={itemClass}>
                <Package size={18} /> Parts Inventory
              </NavLink>
            </li>
            <li>
              <NavLink to="/entities" className={itemClass}>
                <Settings size={18} /> Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/suppliers" className={itemClass}>
                <Users size={18} /> Suppliers
              </NavLink>
            </li>
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
      <main className="flex-1 ml-64 h-full overflow-y-auto bg-gray-50 p-6">
        {/* All your pages/components will render here */}
      </main>
    </div>
  );
}
