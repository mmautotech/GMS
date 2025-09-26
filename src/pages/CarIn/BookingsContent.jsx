// src/pages/CarIn/BookingsContent.jsx
import React from "react";

export default function BookingsContent({
    loading,
    error,
    items,
    TableComponent,
    tableProps,
    emptyMessage = "No data found.",
}) {
    console.log("📦 BookingsContent items:", items);

    if (loading) return <p className="text-gray-600">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    if (!items || items.length === 0) {
        return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <TableComponent {...tableProps} />
        </div>
    );
}