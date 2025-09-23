import React from "react";

/**
 * Dashboard-only StatusBadge
 * - Accepts `status` (string) and optional `title` (string) for native tooltip
 * - Slightly smaller (text-xs) to match your compact table
 * - Keeps capitalization on the chip text
 */
const STATUS_STYLES = {
    pending: "bg-yellow-100 text-yellow-800",
    arrived: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

export default function DashboardStatusBadge({ status, title = "", className = "" }) {
    const key = String(status || "").toLowerCase();
    const cls = STATUS_STYLES[key] || "bg-gray-100 text-gray-800";

    return (
        <span
            title={title}
            className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${cls} ${className}`}
            aria-label={title || key || "status"}
        >
            {key || "unknown"}
        </span>
    );
}
