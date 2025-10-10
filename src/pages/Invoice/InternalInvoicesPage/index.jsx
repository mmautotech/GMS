import React, { useState, useEffect } from "react";
import { Button } from "../../../ui/button.js";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

import { useInternalInvoices } from "../../../hooks/useInternalInvoices.js";
import {
    exportInternalInvoiceById,
    getInternalInvoiceById,
} from "../../../lib/api/internalinvoiceApi.js";

import InvoiceTable from "../../../components/InvoiceTable.jsx";
import ParamsSummary from "../../../components/ParamsSummary.jsx";
import InlineSpinner from "../../../components/InlineSpinner.jsx";
import StatCard from "../../../components/StatCard.jsx";
import DetailModal from "./DetailModal.jsx"; // ✅ You already have this

export default function InternalInvoicePage() {
    const location = useLocation();
    const [refreshKey, setRefreshKey] = useState(0);

    // 👇 Refresh when user navigates back to this page
    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [location.key]);

    // 👇 Also refresh on browser/tab focus (covers tab switches)
    useEffect(() => {
        const handleFocus = () => setRefreshKey((k) => k + 1);
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, []);

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
        filters,
        backendParams,
        setFilters,
        setPage,
        resetFilters,
        fetchInvoices,
        pagination,
    } = useInternalInvoices({ refreshKey }); // ✅ pass refreshKey to trigger re-fetch

    const [localFilters, setLocalFilters] = useState(filters);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // initial fetch
    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices, refreshKey]);

    /** 🔹 Apply filters manually */
    const handleApply = () => {
        setFilters(localFilters);
        setPage(1);
        fetchInvoices();
    };

    /** 🔹 Reset filters */
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

    /** 🔹 View PDF (open in new tab) */
    const handleExportPDF = async (id) => {
        try {
            toast.info("Opening PDF...");
            await exportInternalInvoiceById(id);
        } catch (error) {
            console.error("❌ PDF export failed:", error);
            toast.error("Failed to open PDF");
        }
    };

    /** 🔹 View invoice details (modal) */
    const handleViewDetail = async (id) => {
        try {
            setLoadingDetail(true);
            const res = await getInternalInvoiceById(id);
            if (res?.success && res?.data) {
                setSelectedInvoice(res.data);
                setDetailModalOpen(true);
            } else {
                toast.error("No details found for this invoice");
            }
        } catch (err) {
            console.error("❌ Failed to fetch internal invoice:", err);
            toast.error("Failed to load invoice details");
        } finally {
            setLoadingDetail(false);
        }
    };

    /** 🔹 Pagination */
    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchInvoices();
    };

    return (
        <div className="p-6 space-y-6">
            {/* 🧾 Page Header */}
            <h1 className="text-2xl font-bold text-blue-700 mb-4">
                Internal Invoices
            </h1>

            {/* 📊 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <StatCard title="Total Invoices" value={totalCount || invoices.length} />
                <StatCard title="Total Sales (£)" value={totalSales?.toFixed(2)} />
                <StatCard title="Total Purchases (£)" value={totalPurchases?.toFixed(2)} />
                <StatCard title="Total Net VAT (£)" value={totalNetVat?.toFixed(2)} />
                <StatCard title="Total Profit (£)" value={totalProfit?.toFixed(2)} />
            </div>

            {/* 🔍 Filters Section */}
            <div className="bg-white shadow-sm border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <input
                        type="text"
                        value={localFilters.search}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, search: e.target.value }))
                        }
                        placeholder="Search..."
                        className="border rounded-md p-2 text-sm w-full"
                    />
                    <input
                        type="date"
                        value={localFilters.fromDate}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, fromDate: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm w-full"
                    />
                    <input
                        type="date"
                        value={localFilters.toDate}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, toDate: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm w-full"
                    />
                    <select
                        value={localFilters.status}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, status: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm w-full"
                    >
                        <option value="">All Statuses</option>
                        <option value="Partial">Partial</option>
                        <option value="Receivable">Receivable</option>
                        <option value="Received">Received</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                        value={localFilters.sortOn}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, sortOn: e.target.value }))
                        }
                        className="border rounded-md p-2 text-sm w-full"
                    >
                        <option value="landingDate">Landing Date</option>
                        <option value="createdAt">Created Date</option>
                    </select>
                    <select
                        value={localFilters.sortOrder}
                        onChange={(e) =>
                            setLocalFilters((f) => ({ ...f, sortOrder: e.target.value }))
                        }
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

            {/* 🧾 Table */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-600">
                    <InlineSpinner size={32} />
                    <span className="ml-3">Loading internal invoices...</span>
                </div>
            ) : (
                <InvoiceTable
                    mode="internal"
                    invoices={invoices}
                    filters={filters}
                    pagination={pagination}
                    onExportPdf={handleExportPDF}
                    onViewDetail={handleViewDetail}
                    onPageChange={handlePageChange}
                />
            )}

            {/* 📋 Params Summary */}
            <ParamsSummary params={backendParams} />

            {/* 🪟 Details Modal */}
            {detailModalOpen && (
                <DetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    loading={loadingDetail}
                    title={
                        selectedInvoice?.invoiceNo
                            ? `Invoice Details – ${selectedInvoice.invoiceNo}`
                            : "Invoice Details"
                    }
                    data={selectedInvoice}
                />
            )}
        </div>
    );
}
