import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ onClose, onLogout, username }) {
  const itemClass = ({ isActive }) =>
    `w-full text-left block py-2 px-3 rounded transition ${isActive ? "bg-gray-700" : "hover:bg-gray-700"
    }`;

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col transition-all duration-300">
      <div className="p-4 text-2xl font-bold border-b border-gray-700 flex justify-between items-center">
        My Dashboard
        <button
          className="text-sm bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
          onClick={onClose}
          title="Hide sidebar"
        >
          ✖
        </button>
      </div>

      <div className="px-4 py-3 text-sm text-gray-300 border-b border-gray-700">
        Signed in as <span className="text-white font-semibold">{username}</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink to="/dashboard" className={itemClass}>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/pre-booking" className={itemClass}>Pre-Booking</NavLink>
          </li>
          <li>
            <NavLink to="/car-in" className={itemClass}>CarIn</NavLink>
          </li>
          <li>
            <NavLink to="/invoice" className={itemClass}>Invoices</NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={itemClass}>Settings</NavLink>
          </li>
          <li>
            <NavLink to="/entities" className={itemClass}>Entities</NavLink>
          </li>

        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          className="w-full py-2 bg-red-600 hover:bg-red-700 rounded"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
