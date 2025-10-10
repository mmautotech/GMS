import React from "react";

/**
 * 🎨 Centralized Status Badge Component
 * Supports both operational (pending, arrived...) and financial (received, payable...) statuses.
 */
const STATUS_STYLES = {
    // ---- Operational ----
    pending: "bg-yellow-100 text-yellow-800",
    arrived: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",

    // ---- Financial (Invoices / Payments) ----
    received: "bg-green-100 text-green-800",
    receivable: "bg-blue-100 text-blue-800",
    payable: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
};

/**
 * 🏷️ StatusBadge Component
 * - Auto-capitalizes
 * - Falls back gracefully if unknown
 */
export default function StatusBadge({ status }) {
    const key = String(status || "").toLowerCase().trim();
    const cls = STATUS_STYLES[key] || "bg-gray-100 text-gray-800";

    // Capitalize first letter and keep others as-is for nice UI display
    const label =
        key.length > 0 ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown";

    return (
        <span
            className={`inline-block px-2 py-1 rounded text-sm font-semibold capitalize ${cls}`}
        >
            {label}
        </span>
    );
}
