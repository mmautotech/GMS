import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { X, Loader2, Minus } from "lucide-react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { useInvoiceByBookingId } from "../../hooks/useInvoiceByBookingId.js";

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function InvoiceModal({ bookingId, isOpen, onClose }) {
    const [invoiceData, setInvoiceData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const { invoice, loading, refreshInvoice } = useInvoiceByBookingId(bookingId, isOpen);

    useEffect(() => {
        if (invoice) {
            setInvoiceData(invoice);
            setOriginalData(invoice);
        } else {
            setInvoiceData(null);
            setOriginalData(null);
        }
    }, [invoice]);

    const isDirty = useMemo(() => {
        if (!invoiceData || !originalData) return false;
        return !deepEqual(invoiceData, originalData);
    }, [invoiceData, originalData]);

    const hasInvoice = Boolean(invoiceData?._id);
    const isBusy = loading || saving || generating;
    const canSave = isDirty && !isBusy && hasInvoice;
    const canReset = isDirty && !isBusy && hasInvoice;
    const canView = hasInvoice && !isBusy && !isDirty;

    // ─────────── Field Handlers ───────────
    const handleFieldChange = (field, value) =>
        setInvoiceData((prev) => ({ ...prev, [field]: value }));

    const handleItemChange = (index, field, value) => {
        const updated = [...(invoiceData?.items || [])];
        updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) : value };
        setInvoiceData((prev) => ({ ...prev, items: updated }));
    };

    const handleAddItem = () =>
        setInvoiceData((prev) => ({
            ...prev,
            items: [...(prev.items || []), { description: "", amount: 0 }],
        }));

    const handleRemoveItem = (index) => {
        const updated = [...(invoiceData?.items || [])];
        updated.splice(index, 1);
        setInvoiceData((prev) => ({ ...prev, items: updated }));
        toast.info("🗑️ Item removed");
    };

    // ─────────── Totals ───────────
    const subtotal = (invoiceData?.items || []).reduce(
        (sum, it) => sum + Number(it?.amount || 0),
        0
    );
    const discount = Number(invoiceData?.discountAmount || 0);
    const vat = invoiceData?.vatIncluded ? (subtotal - discount) * 0.2 : 0;
    const total = subtotal - discount + vat;

    const handleReset = () => {
        if (!originalData) return;
        setInvoiceData(originalData);
        toast.info("🔄 Changes reverted to last saved state");
    };

    const handleSave = async () => {
        if (!invoiceData?._id) return toast.error("Invoice ID missing.");
        try {
            setSaving(true);
            const payload = {
                items: invoiceData.items,
                discountAmount: Number(invoiceData.discountAmount || 0),
                vatIncluded: Boolean(invoiceData.vatIncluded),
                status: invoiceData.status,
            };
            const updated = await InvoiceApi.updateInvoice(invoiceData._id, payload);
            setInvoiceData(updated);
            setOriginalData(updated);
            toast.success("✅ Invoice updated successfully");
            await refreshInvoice({ silent: true });
        } catch (err) {
            console.error("Save failed:", err);
            toast.error(err.message || "Failed to update invoice");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const newInvoice = await InvoiceApi.generateInvoiceByBookingId(bookingId);
            setInvoiceData(newInvoice);
            setOriginalData(newInvoice);
            toast.success(hasInvoice ? "🔄 Invoice regenerated" : "🧾 Invoice generated");
            await refreshInvoice({ silent: true });
        } catch (err) {
            console.error("Generation error:", err);
            toast.error(err.message || "Failed to generate invoice");
        } finally {
            setGenerating(false);
        }
    };

    const handleViewPdf = () => {
        if (!invoiceData?._id) return toast.error("Invoice ID missing.");
        InvoiceApi.viewInvoicePdf(invoiceData._id);
    };

    // ─────────── Close Logic ───────────
    const handleClose = useCallback(() => {
        toast.dismiss(); // close all toasts cleanly
        onClose?.(); // trigger modal close
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const listener = (e) => e.key === "Escape" && handleClose();
        document.addEventListener("keydown", listener);
        return () => document.removeEventListener("keydown", listener);
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col relative mx-4"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Loading Overlay */}
                {isBusy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto relative">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        {hasInvoice ? `Invoice ${invoiceData?.invoiceNo || ""}` : "No Invoice Found"}
                    </h2>

                    {loading ? (
                        <p className="text-center text-gray-500 py-6">Loading invoice details...</p>
                    ) : hasInvoice ? (
                        <>
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                                <div>
                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {invoiceData?.createdAt
                                            ? new Date(invoiceData.createdAt).toLocaleDateString()
                                            : "-"}
                                    </p>
                                    <p className="mt-1">
                                        <strong>Generated By:</strong>{" "}
                                        {invoiceData?.createdBy ||
                                            invoiceData?.createdBy?.username ||
                                            "System"}
                                    </p>
                                    <label className="block mt-2">
                                        <strong>Status:</strong>
                                        <select
                                            className="ml-2 border rounded p-1"
                                            value={invoiceData.status || "Receivable"}
                                            onChange={(e) => handleFieldChange("status", e.target.value)}
                                            disabled={isBusy}
                                        >
                                            <option value="Receivable">Receivable</option>
                                            <option value="Received">Received</option>
                                            <option value="Partial">Partial</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <p>
                                        <strong>Customer:</strong> {invoiceData.customerName || "-"}
                                    </p>
                                    <p>
                                        <strong>Contact:</strong> {invoiceData.contactNo || "-"}
                                    </p>
                                    <p>
                                        <strong>Vehicle:</strong> {invoiceData.vehicleRegNo || "-"}{" "}
                                        {invoiceData.makeModel ? `(${invoiceData.makeModel})` : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <button
                                type="button"
                                className="px-2 py-1 bg-green-600 text-white rounded text-sm mb-2 disabled:opacity-50"
                                onClick={handleAddItem}
                                disabled={isBusy}
                            >
                                Add Item
                            </button>

                            <table className="w-full mb-6 border text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-center w-10">–</th>
                                        <th className="border p-2 text-left">Description</th>
                                        <th className="border p-2 text-right">Amount (£)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoiceData.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={isBusy}
                                                    title="Remove item"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                            </td>
                                            <td className="border p-2">
                                                <input
                                                    type="text"
                                                    className="w-full border rounded p-1"
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "description", e.target.value)
                                                    }
                                                    disabled={isBusy}
                                                />
                                            </td>
                                            <td className="border p-2 text-right">
                                                <input
                                                    type="number"
                                                    className="w-24 border rounded p-1 text-right"
                                                    value={item.amount}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "amount", e.target.value)
                                                    }
                                                    disabled={isBusy}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end text-sm">
                                <div className="w-1/3">
                                    <div className="flex justify-between py-1">
                                        <span>Subtotal:</span>
                                        <span>£{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Discount:</span>
                                        <input
                                            type="number"
                                            className="w-24 border rounded p-1 text-right"
                                            value={invoiceData.discountAmount || 0}
                                            onChange={(e) =>
                                                handleFieldChange("discountAmount", Number(e.target.value || 0))
                                            }
                                            disabled={isBusy}
                                        />
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>VAT (20%):</span>
                                        <span>£{vat.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-bold border-t mt-2 pt-2">
                                        <span>Total:</span>
                                        <span>£{total.toFixed(2)}</span>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(invoiceData.vatIncluded)}
                                            onChange={(e) => handleFieldChange("vatIncluded", e.target.checked)}
                                            disabled={isBusy}
                                        />
                                        VAT Included
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">
                            No invoice found for this booking.
                        </p>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-wrap justify-end gap-2 p-4 border-t bg-gray-50">
                    <button className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded" onClick={handleClose}>
                        Close
                    </button>

                    <button
                        className={`px-4 py-2 ${hasInvoice ? "bg-purple-600" : "bg-indigo-600"
                            } hover:opacity-90 text-white rounded disabled:opacity-50`}
                        onClick={handleGenerate}
                        disabled={isBusy}
                    >
                        {generating ? "Processing..." : hasInvoice ? "Regenerate" : "Generate"}
                    </button>

                    {hasInvoice && (
                        <>
                            <button
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
                                onClick={handleReset}
                                disabled={!canReset}
                            >
                                Reset
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                                onClick={handleSave}
                                disabled={!canSave}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                                onClick={handleViewPdf}
                                disabled={!canView}
                            >
                                View PDF
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
