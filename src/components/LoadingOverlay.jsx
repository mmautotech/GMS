// src/components/LoadingOverlay.jsx
import React from "react";
import InlineSpinner from "./InlineSpinner";

export default function LoadingOverlay({ isLoading }) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 pointer-events-auto">
            <InlineSpinner size={64} /> {/* Big spinner */}
        </div>
    );
}
