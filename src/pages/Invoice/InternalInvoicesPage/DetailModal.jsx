import React from "react";
import { X } from "lucide-react";

export default function DetailModal({ isOpen, onClose, loading, data }) {
    if (!isOpen) return null;

    const formatDate = (d) => {
        if (!d) return "N/A";
        const date = new Date(d);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative max-h-[85vh] overflow-y-auto">
                {/* ❌ Close */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <h2 className="text-xl font-bold text-blue-700 mb-4">
                    Internal Invoice Details
                </h2>

                {loading ? (
                    <p className="text-gray-500">Loading details...</p>
                ) : !data ? (
                    <p className="text-gray-500">No data available.</p>
                ) : (
                    <>
                        {/* ===============================
                           🧩 BASIC INFO
                        =============================== */}
                        <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                            <div>
                                <p>
                                    <strong>Invoice No:</strong>{" "}
                                    {data.invoice?.invoiceNo || "N/A"}
                                </p>
                                <p>
                                    <strong>Customer:</strong>{" "}
                                    {data.invoice?.customerName || "N/A"}
                                </p>
                                <p>
                                    <strong>Contact:</strong>{" "}
                                    {data.invoice?.contactNo || "N/A"}
                                </p>
                                <p>
                                    <strong>Status:</strong>{" "}
                                    {data.invoice?.status || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p>
                                    <strong>Vehicle:</strong>{" "}
                                    {data.booking?.makeModel || "N/A"}
                                </p>
                                <p>
                                    <strong>Reg No:</strong>{" "}
                                    {data.booking?.vehicleRegNo || "N/A"}
                                </p>
                                <p>
                                    <strong>Arrived At:</strong>{" "}
                                    {formatDate(data.booking?.arrivedAt)}
                                </p>
                                <p>
                                    <strong>Created By:</strong>{" "}
                                    {data.invoice?.createdBy || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* ===============================
                           💰 FINANCIAL SUMMARY
                        =============================== */}
                        <h3 className="font-semibold text-blue-700 mb-2">
                            Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div>
                                <strong>Sales:</strong>{" "}
                                £{data.totals?.sales?.toFixed(2) || "0.00"}
                            </div>
                            <div>
                                <strong>Purchases:</strong>{" "}
                                £{data.totals?.purchases?.toFixed(2) || "0.00"}
                            </div>
                            <div>
                                <strong>Net VAT:</strong>{" "}
                                £{data.totals?.netVat?.toFixed(2) || "0.00"}
                            </div>
                            <div>
                                <strong>Profit:</strong>{" "}
                                £{data.totals?.calculatedProfit?.toFixed(2) || "0.00"}
                            </div>
                        </div>

                        {/* ===============================
                           🧾 SALES ITEMS
                        =============================== */}
                        <h3 className="font-semibold text-blue-700 mb-2">
                            Sales Items
                        </h3>
                        <table className="w-full text-sm border mb-6">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2 text-left">Description</th>
                                    <th className="border p-2 text-right">Amount (£)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.invoice?.items?.length ? (
                                    data.invoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="border p-2">
                                                {item.description}
                                            </td>
                                            <td className="border p-2 text-right">
                                                {item.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="2"
                                            className="text-center text-gray-500 p-3"
                                        >
                                            No sales items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* ===============================
                           🧾 PURCHASE INVOICES
                        =============================== */}
                        <h3 className="font-semibold text-blue-700 mb-2">
                            Purchase Invoices
                        </h3>
                        {data.purchases?.length ? (
                            data.purchases.map((pi, idx) => (
                                <div
                                    key={idx}
                                    className="mb-3 border rounded-lg p-3 bg-gray-50"
                                >
                                    <div className="flex justify-between text-sm">
                                        <p>
                                            <strong>Supplier:</strong>{" "}
                                            {pi.supplier} ({pi.supplierContact || "N/A"})
                                        </p>
                                        <p>
                                            <strong>Invoice:</strong>{" "}
                                            {pi.vendorInvoiceNumber}
                                        </p>
                                    </div>
                                    <p>
                                        <strong>Payment Date:</strong>{" "}
                                        {formatDate(pi.paymentDate)}
                                    </p>
                                    <p>
                                        <strong>Status:</strong> {pi.paymentStatus}
                                    </p>
                                    <table className="w-full text-sm mt-2 border">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border p-2 text-left">Part</th>
                                                <th className="border p-2 text-right">Rate (£)</th>
                                                <th className="border p-2 text-right">Qty</th>
                                                <th className="border p-2 text-right">Line Total (£)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pi.items?.map((it, j) => (
                                                <tr key={j}>
                                                    <td className="border p-2">{it.part}</td>
                                                    <td className="border p-2 text-right">
                                                        {it.rate.toFixed(2)}
                                                    </td>
                                                    <td className="border p-2 text-right">
                                                        {it.quantity}
                                                    </td>
                                                    <td className="border p-2 text-right">
                                                        {it.lineTotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-semibold">
                                                <td colSpan="3" className="border p-2 text-right">
                                                    Total:
                                                </td>
                                                <td className="border p-2 text-right">
                                                    £{pi.total?.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">
                                No purchase invoices linked.
                            </p>
                        )}

                        {/* ===============================
                           📅 Meta Info
                        =============================== */}
                        <div className="mt-6 text-xs text-gray-500 border-t pt-3">
                            <p>
                                Created At: {formatDate(data.createdAt)} | Updated At:{" "}
                                {formatDate(data.updatedAt)}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
