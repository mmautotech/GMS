// src/components/StatusBadge.jsx
import React from "react";

const STATUS_STYLES = {
    pending: "bg-yellow-100 text-yellow-800",
    arrived: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",  // ✅ corrected
    cancelled: "bg-red-100 text-red-800",      // ✅ corrected
};

export default function StatusBadge({ status }) {
    const key = String(status || "").toLowerCase();
    const cls = STATUS_STYLES[key] || "bg-gray-100 text-gray-800";
    return (
        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold capitalize ${cls}`}>
            {key || "unknown"}
        </span>
    );
}
