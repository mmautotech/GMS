import React, { useState, useEffect } from "react";
import { Button } from "../../../ui/button.js";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { useInternalInvoices } from "../../../hooks/useInternalInvoices.js";
import { exportInternalInvoiceById } from "../../../lib/api/internalinvoiceApi.js";

import ParamsSummary from "../../../components/ParamsSummary.jsx";
import StatusBadge from "../../../components/StatusBadge.jsx";
import InlineSpinner from "../../../components/InlineSpinner.jsx";
import StatCard from "../../../components/StatCard.jsx";

export default function InternalInvoicePage() {
    const {
        invoices,
        loading,
        page,
        totalPages,
        totalCount,
        totalSales,
        totalPurchases,
        totalNetVat,
        totalProfit,
        limit,
        setLimit,
        filters,
        backendParams,
        setFilters,
        setPage,
        resetFilters,
        fetchInvoices,
    } = useInternalInvoices();

    const [expanded, setExpanded] = useState(null);

    // ✅ Local filters (not applied until Apply button pressed)
    const [localFilters, setLocalFilters] = useState(filters);

    // ✅ Sync filters to local on mount
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // ✅ Initial load + refetch on focus
    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    useEffect(() => {
        const handleFocus = () => {
            console.log("🔄 Refetching Internal Invoices (focus event)");
            fetchInvoices();
        };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetchInvoices]);

    // ✅ Apply button
    const handleApply = () => {
        setFilters(localFilters);
        setPage(1);
        fetchInvoices();
    };

    // ✅ Reset button
    const handleReset = () => {
        const defaultFilters = {
            search: "",
            status: "",
            fromDate: "",
            toDate: "",
            sortOn: "landingDate",
            sortOrder: "desc",
        };
        setLocalFilters(defaultFilters);
        setFilters(defaultFilters);
        setPage(1);
        fetchInvoices();
    };

    // ✅ Export PDF
    const handleExportPDF = async (id) => {
        try {
            toast.info("Generating PDF...");
            await exportInternalInvoiceById(id);
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("❌ Export failed:", error);
            toast.error("Failed to export PDF");
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* 🧾 Page Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-blue-700">
                    Internal Invoices
                </h1>
            </div>

            {/* 📊 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <StatCard title="Total Invoices" value={totalCount || invoices.length} />
                <StatCard title="Total Sales (£)" value={totalSales.toFixed(2)} />
                <StatCard title="Total Purchases (£)" value={totalPurchases.toFixed(2)} />
                <StatCard title="Total Net VAT (£)" value={totalNetVat.toFixed(2)} />
                <StatCard title="Total Profit (£)" value={totalProfit.toFixed(2)} />
            </div>

            {/* 🔍 Filters Section */}
            <div className="bg-white shadow-sm border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    {/* Search */}
                    <input
                        type="text"
                        value={localFilters.search}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
                        placeholder="Search..."
                        className="border rounded-md p-2 text-sm w-full"
                    />

                    {/* From Date */}
                    <input
                        type="date"
                        value={localFilters.fromDate}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, fromDate: e.target.value }))}
                        className="border rounded-md p-2 text-sm w-full"
                    />

                    {/* To Date */}
                    <input
                        type="date"
                        value={localFilters.toDate}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, toDate: e.target.value }))}
                        className="border rounded-md p-2 text-sm w-full"
                    />

                    {/* Status */}
                    <select
                        value={localFilters.status}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
                        className="border rounded-md p-2 text-sm w-full"
                    >
                        <option value="">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* Sort Field */}
                    <select
                        value={localFilters.sortOn}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, sortOn: e.target.value }))}
                        className="border rounded-md p-2 text-sm w-full"
                    >
                        <option value="landingDate">Landing Date</option>
                        <option value="createDate">Created Date</option>
                    </select>

                    {/* Sort Order */}
                    <select
                        value={localFilters.sortOrder}
                        onChange={(e) => setLocalFilters((f) => ({ ...f, sortOrder: e.target.value }))}
                        className="border rounded-md p-2 text-sm w-full"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        onClick={handleApply}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Apply
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                </div>
            </div>

            {/* 🧩 Params Summary */}
            <div className="text-sm text-gray-900 flex flex-wrap gap-2">
                <ParamsSummary params={backendParams} />
            </div>

            {/* 🧾 Table Section */}
            <div className="bg-white border rounded-lg shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <InlineSpinner size={22} /> &nbsp; Loading internal invoices...
                    </div>
                ) : invoices.length === 0 ? (
                    <p className="text-center text-gray-600 py-10">
                        No internal invoices found.
                    </p>
                ) : (
                    <>
                        <table className="min-w-full text-sm border-t">
                            <thead className="bg-gray-900 text-gray-100 text-sm font-medium">
                                <tr>
                                    <th className="p-2 text-left">Invoice Date</th>
                                    <th className="p-2 text-left">Invoice No</th>
                                    <th className="p-2 text-left">Landing Date</th>
                                    <th className="p-2 text-left">Customer</th>
                                    <th className="p-2 text-left">Vehicle</th>
                                    <th className="p-2 text-left">Status</th>
                                    <th className="p-2 text-left">Sales (£)</th>
                                    <th className="p-2 text-left">Purchases (£)</th>
                                    <th className="p-2 text-left">Net VAT (£)</th>
                                    <th className="p-2 text-left">Profit (£)</th>
                                    <th className="p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv, index) => (
                                    <React.Fragment key={inv._id}>
                                        <tr
                                            className={`border-t hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                }`}
                                        >
                                            <td className="p-2">
                                                {inv.createdAt
                                                    ? new Date(inv.createdAt).toLocaleDateString("en-GB")
                                                    : "-"}
                                            </td>
                                            <td className="p-2 font-medium">{inv.invoiceNo ?? "-"}</td>
                                            <td className="p-2">
                                                {inv.landingDate
                                                    ? new Date(inv.landingDate).toLocaleDateString("en-GB")
                                                    : "-"}
                                            </td>
                                            <td className="p-2">{inv.customerName ?? "-"}</td>
                                            <td className="p-2">{inv.vehicle ?? "-"}</td>
                                            <td className="p-2">
                                                <StatusBadge status={inv.status} />
                                            </td>
                                            <td className="p-2 font-semibold text-blue-700">
                                                £{(inv.sales || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 text-red-600">
                                                £{(inv.purchases || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 italic text-gray-500">
                                                VAT £{(inv.netVat || 0).toFixed(2)}
                                            </td>
                                            <td
                                                className={`p-2 font-bold ${inv.calculatedProfit >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                £{(inv.calculatedProfit || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setExpanded(
                                                            expanded === inv._id ? null : inv._id
                                                        )
                                                    }
                                                >
                                                    {expanded === inv._id ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleExportPDF(inv._id)}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    PDF
                                                </Button>
                                            </td>
                                        </tr>

                                        {expanded === inv._id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="11" className="p-3 text-xs text-gray-700">
                                                    <p>
                                                        <strong>Created At:</strong>{" "}
                                                        {new Date(inv.createdAt).toLocaleString()}
                                                    </p>
                                                    <p>
                                                        <strong>Landing Date:</strong>{" "}
                                                        {inv.landingDate
                                                            ? new Date(inv.landingDate).toLocaleString()
                                                            : "N/A"}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div className="flex justify-between items-center border-t p-2 text-sm bg-gray-50 rounded-b-lg">
                            <span className="font-medium text-gray-700">
                                Total Invoices: {totalCount ?? invoices.length}
                            </span>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={page <= 1}
                                    onClick={() => {
                                        setPage((p) => Math.max(1, p - 1));
                                        fetchInvoices();
                                    }}
                                >
                                    Prev
                                </Button>
                                <span>
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page >= totalPages}
                                    onClick={() => {
                                        setPage((p) => Math.min(totalPages, p + 1));
                                        fetchInvoices();
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
