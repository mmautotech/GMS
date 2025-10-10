import React, { useState } from "react";
import { RotateCcw, Filter } from "lucide-react";
import { toast } from "react-toastify";

import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { createInternalInvoice } from "../../lib/api/internalinvoiceApi.js";
import useInvoices from "../../hooks/useInvoices.js";

import StatCard from "../../components/StatCard.jsx";
import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import InvoiceTable from "../../components/InvoiceTable.jsx";

/**
 * 🧾 Main Invoices Page
 * Uses reusable <InvoiceTable /> for clean layout and scrollable table.
 */
export default function Invoices() {
    const {
        invoices,
        totals,
        pagination,
        params,
        filters,
        setFilters,
        resetFilters,
        loading,
        refresh,
    } = useInvoices();

    const [tempFilters, setTempFilters] = useState(filters);
    const [creatingInternalInvoice, setCreatingInternalInvoice] = useState(false);

    // ---------------- Actions ----------------
    const handleViewPdf = (invoiceId, isProforma = false) => {
        InvoiceApi.viewInvoicePdf(invoiceId, isProforma);
    };

    const handleCreateInternalInvoice = async (invoiceId) => {
        if (!invoiceId) return;
        try {
            setCreatingInternalInvoice(true);
            await createInternalInvoice({ invoiceId });
            toast.success("✅ Internal invoice created successfully!");
            refresh();
        } catch (err) {
            console.error("Error creating internal invoice:", err);
            toast.error(
                err?.response?.data?.message ||
                err.message ||
                "Failed to create internal invoice"
            );
        } finally {
            setCreatingInternalInvoice(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    // ---------------- Filter Controls ----------------
    const handleApplyFilters = () => {
        setFilters({ ...tempFilters, page: 1 });
    };

    const handleResetFilters = () => {
        const reset = {
            search: "",
            status: "",
            fromDate: "",
            toDate: "",
            limit: 10,
            page: 1,
            sortOn: "createdAt",
            sortOrder: "desc",
        };
        setTempFilters(reset);
        setFilters(reset);
    };

    // ---------------- Helpers ----------------
    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-GB") : "—";

    const formatAmount = (inv) => {
        const subtotal = inv.totalAmount - (inv.discountAmount || 0);
        const total = inv.vatIncluded ? subtotal * 1.2 : subtotal;
        return `£${total.toFixed(2)}`;
    };

    // ---------------- UI ----------------
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Invoices</h1>

            {/* ✅ Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Invoices" value={totals.totalInvoices || 0} />
                <StatCard title="Received" value={totals.received || 0} />
                <StatCard title="Receivable" value={totals.receivable || 0} />
                <StatCard title="Partial" value={totals.partial || 0} />
            </div>

            {/* ✅ Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 flex-wrap">
                {/* 🔍 Search */}
                <input
                    type="text"
                    placeholder="Search (Invoice, Name, Contact, Reg No, Model, Postal...)"
                    value={tempFilters.search}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, search: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />

                {/* 📅 From / To Date */}
                <input
                    type="date"
                    value={tempFilters.fromDate}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, fromDate: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />
                <input
                    type="date"
                    value={tempFilters.toDate}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, toDate: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />

                {/* 📦 Status */}
                <select
                    value={tempFilters.status}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, status: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    <option value="">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Receivable">Receivable</option>
                    <option value="Partial">Partial</option>
                </select>

                {/* 🧮 Sort Field */}
                <select
                    value={tempFilters.sortOn || "createdAt"}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, sortOn: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    <option value="createdAt">Created Date</option>
                    <option value="landingDate">Landing Date</option>
                </select>

                {/* ↕️ Sort Order */}
                <select
                    value={tempFilters.sortOrder || "desc"}
                    onChange={(e) =>
                        setTempFilters((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>

                {/* 🧾 Per Page */}
                <select
                    value={tempFilters.limit}
                    onChange={(e) =>
                        setTempFilters((f) => ({
                            ...f,
                            limit: Number(e.target.value),
                        }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                            {n} / page
                        </option>
                    ))}
                </select>

                {/* 🔘 Apply / Reset Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleApplyFilters}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Apply Filters"
                    >
                        <Filter size={16} />
                        Apply
                    </button>
                    <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        title="Reset Filters"
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                </div>
            </div>

            {/* ✅ Applied Filter Summary */}
            <ParamsSummary params={{ ...filters, ...params }} />

            {/* ✅ Table Section */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-600">
                    <InlineSpinner size={32} />
                    <span className="ml-3">Loading invoices...</span>
                </div>
            ) : (
                <InvoiceTable
                    invoices={invoices}
                    filters={filters}
                    pagination={pagination}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                    onViewPdf={handleViewPdf}
                    onCreateInternalInvoice={handleCreateInternalInvoice}
                    onPageChange={handlePageChange}
                    creatingInternalInvoice={creatingInternalInvoice}
                />
            )}
        </div>
    );
}
