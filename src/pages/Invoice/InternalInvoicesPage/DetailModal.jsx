import React from "react";
import { X } from "lucide-react";

export default function InternalInvoiceDetailModal({ isOpen, onClose, invoice }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative max-h-[85vh] overflow-y-auto">
                {/* ❌ Close */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                {/* 🧾 Header */}
                <h2 className="text-xl font-bold text-blue-700 mb-4">
                    Internal Invoice Details
                </h2>

                {!invoice ? (
                    <p className="text-gray-500">Loading details...</p>
                ) : (
                    <>
                        {/* 🧩 Basic Info */}
                        <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                            <div>
                                <p><strong>Invoice No:</strong> {invoice.invoice?.invoiceNo || "N/A"}</p>
                                <p><strong>Customer:</strong> {invoice.invoice?.customerName || "N/A"}</p>
                                <p><strong>Contact:</strong> {invoice.invoice?.contactNo || "N/A"}</p>
                                <p><strong>Status:</strong> {invoice.invoice?.status || "N/A"}</p>
                            </div>
                            <div>
                                <p><strong>Vehicle:</strong> {invoice.booking?.makeModel || "N/A"}</p>
                                <p><strong>Reg No:</strong> {invoice.booking?.vehicleRegNo || "N/A"}</p>
                                <p><strong>Arrived At:</strong> {invoice.booking?.arrivedAt || "N/A"}</p>
                                <p><strong>Created By:</strong> {invoice.invoice?.createdBy || "N/A"}</p>
                            </div>
                        </div>

                        {/* 💰 Financials */}
                        <h3 className="font-semibold text-blue-700 mb-2">Financial Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div><strong>Sales:</strong> £{invoice.totals?.sales?.toFixed(2)}</div>
                            <div><strong>Purchases:</strong> £{invoice.totals?.purchases?.toFixed(2)}</div>
                            <div><strong>Net VAT:</strong> £{invoice.totals?.netVat?.toFixed(2)}</div>
                            <div><strong>Profit:</strong> £{invoice.totals?.calculatedProfit?.toFixed(2)}</div>
                        </div>

                        {/* 🧾 Sales Items */}
                        <h3 className="font-semibold text-blue-700 mb-2">Sales Items</h3>
                        <table className="w-full text-sm border mb-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2 text-left">Description</th>
                                    <th className="border p-2 text-right">Amount (£)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.invoice?.items?.length ? (
                                    invoice.invoice.items.map((i, idx) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{i.description}</td>
                                            <td className="border p-2 text-right">
                                                {i.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="text-center text-gray-500 p-3">
                                            No sales items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* 🧾 Purchase Items */}
                        <h3 className="font-semibold text-blue-700 mb-2">Purchase Invoices</h3>
                        {invoice.purchases?.length ? (
                            invoice.purchases.map((pi, idx) => (
                                <div key={idx} className="mb-3 border rounded p-3 bg-gray-50">
                                    <p className="font-semibold text-gray-700">
                                        Supplier: {pi.supplier} ({pi.supplierContact})
                                    </p>
                                    <table className="w-full text-sm mt-2">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border p-2 text-left">Part</th>
                                                <th className="border p-2 text-right">Rate</th>
                                                <th className="border p-2 text-right">Qty</th>
                                                <th className="border p-2 text-right">Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pi.items?.map((it, j) => (
                                                <tr key={j}>
                                                    <td className="border p-2">{it.part}</td>
                                                    <td className="border p-2 text-right">£{it.rate.toFixed(2)}</td>
                                                    <td className="border p-2 text-right">{it.quantity}</td>
                                                    <td className="border p-2 text-right">£{it.lineTotal.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No purchase invoices linked.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
