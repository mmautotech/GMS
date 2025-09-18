// src/components/Pagination.jsx
import React from "react";

export default function Pagination({
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onPageChange,
}) {
    if (totalPages <= 1) return null;

    const goToPage = (p) => {
        if (p >= 1 && p <= totalPages && p !== page) {
            onPageChange(p);
        }
    };

    return (
        <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            {/* Prev */}
            <button
                disabled={!hasPrevPage}
                onClick={() => goToPage(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
            >
                Previous
            </button>

            {/* Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-3 py-1 border rounded ${p === page ? "bg-blue-500 text-white" : ""
                        }`}
                >
                    {p}
                </button>
            ))}

            {/* Next */}
            <button
                disabled={!hasNextPage}
                onClick={() => goToPage(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}
