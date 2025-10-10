// src/pages/Invoice/Invoice.jsx
import React from "react";
import { Eye, FileText, FilePlus } from "lucide-react";
import { toast } from "react-toastify";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { createInternalInvoice } from "../../lib/api/internalinvoiceApi.js";
import useInvoices from "../../hooks/useInvoices.js";
import StatCard from "../../components/StatCard.jsx";
import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";

export default function Invoices() {
    const {
        invoices,
        totals,
        pagination,
        params,
        filters,
        setFilters,
        loading,
        refresh,
    } = useInvoices();

    const [creatingInternalInvoice, setCreatingInternalInvoice] =
        React.useState(false);

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <input
                    type="text"
                    placeholder="Search (Invoice No, Name, Contact, Reg No, Model...)"
                    value={filters.search}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, fromDate: e.target.value, page: 1 }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />
                <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, toDate: e.target.value, page: 1 }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                />
                <select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    <option value="">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Receivable">Receivable</option>
                    <option value="Partial">Partial</option>
                </select>
                <select
                    value={filters.limit}
                    onChange={(e) =>
                        setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))
                    }
                    className="px-4 py-2 border rounded shadow focus:ring focus:border-blue-300"
                >
                    {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                            {n} / page
                        </option>
                    ))}
                </select>
            </div>

            {/* ✅ Applied Filter Summary */}
            <ParamsSummary params={{ ...filters, ...params }} />

            {/* ✅ Table */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-600">
                    <InlineSpinner size={32} />
                    <span className="ml-3">Loading invoices...</span>
                </div>
            ) : invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No invoices found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow text-sm">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-2 px-3 text-left w-[40px]">#</th>
                                <th className="py-2 px-3 text-left">Date</th>
                                <th className="py-2 px-3 text-left">Invoice No</th>
                                <th className="py-2 px-3 text-left">Vehicle</th>
                                <th className="py-2 px-3 text-left">Customer</th>
                                <th className="py-2 px-3 text-left">Landing</th>
                                <th className="py-2 px-3 text-left">Amount (£)</th>
                                <th className="py-2 px-3 text-left">By</th>
                                <th className="py-2 px-3 text-left">Payment Status</th>
                                <th className="py-2 px-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv, idx) => (
                                <tr
                                    key={inv._id}
                                    className="border-b hover:bg-gray-50 transition"
                                >
                                    {/* # */}
                                    <td className="py-2 px-3">{(filters.page - 1) * filters.limit + idx + 1}</td>

                                    {/* Date */}
                                    <td className="py-2 px-3">{formatDate(inv.createdAt)}</td>

                                    {/* Invoice No */}
                                    <td className="py-2 px-3 font-medium text-gray-800">
                                        {inv.invoiceNo}
                                    </td>

                                    {/* Vehicle */}
                                    <td className="py-2 px-3">
                                        {inv.makeModel} <br />
                                        <span className="text-xs text-gray-500">
                                            ({inv.vehicleRegNo})
                                        </span>
                                    </td>

                                    {/* Customer */}
                                    <td className="py-2 px-3">
                                        {inv.customerName}
                                        <div className="text-xs text-gray-500">
                                            {inv.contactNo} | {inv.postalCode}
                                        </div>
                                    </td>

                                    {/* Landing */}
                                    <td className="py-2 px-3">{formatDate(inv.landingDate)}</td>

                                    {/* Amount */}
                                    <td className="py-2 px-3 font-semibold">
                                        {formatAmount(inv)}
                                    </td>

                                    {/* Created By */}
                                    <td className="py-2 px-3">{inv.createdBy || "N/A"}</td>

                                    {/* Payment Status */}
                                    <td className="py-2 px-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-white text-xs ${inv.status === "Received"
                                                    ? "bg-green-600"
                                                    : inv.status === "Receivable"
                                                        ? "bg-blue-600"
                                                        : "bg-yellow-500"
                                                }`}
                                        >
                                            {inv.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-2 px-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                onClick={() => handleViewPdf(inv._id)}
                                                title="View PDF"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                onClick={() => handleViewPdf(inv._id, true)}
                                                title="Proforma"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                onClick={() => handleCreateInternalInvoice(inv._id)}
                                                title="Create Internal Invoice"
                                                disabled={creatingInternalInvoice}
                                            >
                                                <FilePlus size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ✅ Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-gray-600">
                            Total Invoices: {pagination.total || 0}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                className={`px-3 py-1 rounded ${filters.page === 1
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                disabled={filters.page === 1}
                                onClick={() => handlePageChange(filters.page - 1)}
                            >
                                Prev
                            </button>
                            <span>
                                Page {pagination.page || 1} of {pagination.totalPages || 1}
                            </span>
                            <button
                                className={`px-3 py-1 rounded ${pagination.hasNextPage
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                disabled={!pagination.hasNextPage}
                                onClick={() => handlePageChange(filters.page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
