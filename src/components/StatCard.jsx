// src/pages/StatCard.jsx
import React from "react";

export default function StatCard({ title, value }) {
    return (
        <div className="bg-white p-4 rounded shadow text-center">
            <h2 className="text-gray-600">{title}</h2>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
