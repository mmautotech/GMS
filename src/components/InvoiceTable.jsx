import React from "react";
import { Eye, FileText, FilePlus } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

export default function InvoiceTable({
    mode = "main",
    invoices = [],
    filters = {},
    pagination = {},
    formatDate,
    formatAmount,
    onViewPdf,
    onCreateInternalInvoice,
    onExportPdf, // For internal invoice PDF (view in browser)
    onViewDetail, // For internal invoice detail modal
    onPageChange,
    creatingInternalInvoice = false,
}) {
    const isInternal = mode === "internal";

    return (
        <div className="relative border rounded shadow bg-white">
            <div className="overflow-auto max-h-[70vh]">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-800 text-white sticky top-0 z-10">
                        <tr>
                            {isInternal ? (
                                <>
                                    <th className="py-2 px-3 text-left">Date</th>
                                    <th className="py-2 px-3 text-left">Invoice</th>
                                    <th className="py-2 px-3 text-left">Landing Date</th>
                                    <th className="py-2 px-3 text-left">Customer</th>
                                    <th className="py-2 px-3 text-left">Vehicle</th>
                                    <th className="py-2 px-3 text-left">Status</th>
                                    <th className="py-2 px-3 text-left">Sales(£)</th>
                                    <th className="py-2 px-3 text-left">Purchases(£)</th>
                                    <th className="py-2 px-3 text-left">Net VAT(£)</th>
                                    <th className="py-2 px-3 text-left">Profit(£)</th>
                                    <th className="py-2 px-3 text-center">Actions</th>
                                </>
                            ) : (
                                <>
                                    <th className="py-2 px-3 text-left w-[40px]">#</th>
                                    <th className="py-2 px-3 text-left">Date</th>
                                    <th className="py-2 px-3 text-left">Invoice</th>
                                    <th className="py-2 px-3 text-left">Vehicle</th>
                                    <th className="py-2 px-3 text-left">Customer</th>
                                    <th className="py-2 px-3 text-left">Landing</th>
                                    <th className="py-2 px-3 text-left">Receivable (£)</th>
                                    <th className="py-2 px-3 text-left">By</th>
                                    <th className="py-2 px-3 text-left">Payment Status</th>
                                    <th className="py-2 px-3 text-left">Actions</th>
                                </>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isInternal ? 11 : 10}
                                    className="py-8 text-center text-gray-500"
                                >
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv, idx) => (
                                <tr
                                    key={inv._id}
                                    className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        }`}
                                >
                                    {isInternal ? (
                                        <>
                                            <td className="py-2 px-3">
                                                {inv.createdAt
                                                    ? new Date(inv.createdAt).toLocaleDateString("en-GB")
                                                    : "-"}
                                            </td>
                                            <td className="py-2 px-3">{inv.invoiceNo || "-"}</td>
                                            <td className="py-2 px-3">
                                                {inv.landingDate
                                                    ? new Date(inv.landingDate).toLocaleDateString("en-GB")
                                                    : "-"}
                                            </td>
                                            <td className="py-2 px-3">{inv.customerName || "-"}</td>
                                            <td className="py-2 px-3">{inv.vehicle || "-"}</td>
                                            <td className="py-2 px-3">
                                                <StatusBadge status={inv.status} />
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-blue-700">
                                                £{(inv.sales || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 text-red-600">
                                                £{(inv.purchases || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 italic text-gray-600">
                                                VAT £{(inv.netVat || 0).toFixed(2)}
                                            </td>
                                            <td
                                                className={`py-2 px-3 font-bold ${inv.calculatedProfit >= 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                £{(inv.calculatedProfit || 0).toFixed(2)}
                                            </td>

                                            {/* ✅ FIXED: Internal Invoice Actions */}
                                            <td className="py-2 px-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* 🔹 View Details Modal */}
                                                    <button
                                                        className="px-2 py-1 border rounded text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                                                        onClick={() =>
                                                            onViewDetail && onViewDetail(inv._id)
                                                        }
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>

                                                    {/* 🔹 Open PDF in browser */}
                                                    <button
                                                        className="px-2 py-1 border rounded text-green-600 hover:bg-green-50 flex items-center gap-1"
                                                        onClick={() => {
                                                            if (onExportPdf) onExportPdf(inv._id);
                                                            else
                                                                window.open(
                                                                    `${window.location.origin}/api/internal-invoices/${inv._id}/pdf/view`,
                                                                    "_blank"
                                                                );
                                                        }}
                                                    >
                                                        <FileText size={14} /> PDF
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            {/* 🔹 Main Invoices – UNCHANGED */}
                                            <td className="py-2 px-3">
                                                {(filters.page - 1) * filters.limit + idx + 1}
                                            </td>
                                            <td className="py-2 px-3">{formatDate(inv.createdAt)}</td>
                                            <td className="py-2 px-3 font-medium text-gray-800">
                                                {inv.invoiceNo}
                                            </td>
                                            <td className="py-2 px-3">
                                                {inv.makeModel}
                                                <div className="text-xs text-gray-500">
                                                    ({inv.vehicleRegNo})
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                {inv.customerName}
                                                <div className="text-xs text-gray-500">
                                                    {inv.contactNo} | {inv.postalCode}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">{formatDate(inv.landingDate)}</td>
                                            <td className="py-2 px-3 font-semibold">
                                                {formatAmount(inv)}
                                            </td>
                                            <td className="py-2 px-3">{inv.createdBy || "N/A"}</td>
                                            <td className="py-2 px-3">
                                                <StatusBadge status={inv.status} />
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        onClick={() => onViewPdf(inv._id)}
                                                        title="View PDF"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                        onClick={() => onViewPdf(inv._id, true)}
                                                        title="Proforma"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                        onClick={() => onCreateInternalInvoice(inv._id)}
                                                        title="Create Internal Invoice"
                                                        disabled={creatingInternalInvoice}
                                                    >
                                                        <FilePlus size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✅ Footer */}
            <div className="flex justify-between items-center bg-gray-100 border-t px-4 py-3">
                <span className="text-gray-700 font-medium">
                    Total Invoices: {pagination?.total ?? invoices.length ?? 0}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        className={`px-3 py-1 rounded ${(filters?.page ?? 1) === 1
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        disabled={(filters?.page ?? 1) === 1}
                        onClick={() => onPageChange?.((filters?.page ?? 1) - 1)}
                    >
                        Prev
                    </button>

                    <span className="text-gray-700">
                        Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
                    </span>

                    <button
                        className={`px-3 py-1 rounded ${pagination?.hasNextPage
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        disabled={!pagination?.hasNextPage}
                        onClick={() => onPageChange?.((filters?.page ?? 1) + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
