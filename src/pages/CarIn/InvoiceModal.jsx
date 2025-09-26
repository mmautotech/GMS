// src/components/InvoiceModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { toast } from "react-toastify";
import { X } from "lucide-react";

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function InvoiceModal({ bookingId, isOpen, onClose }) {
    const [invoiceData, setInvoiceData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);

    // ─────────────────────────────── Load invoice on open
    useEffect(() => {
        if (!isOpen || !bookingId) return;

        const fetchInvoice = async () => {
            setLoading(true);
            try {
                const data = await InvoiceApi.getInvoiceByBookingId(bookingId);
                if (data?._id) {
                    setInvoiceData(data);
                    setOriginalData(data);
                } else {
                    toast.info("No invoice found for this booking.");
                    setInvoiceData(null);
                    setOriginalData(null);
                }
            } catch (err) {
                console.error("Failed to fetch invoice", err);
                toast.error("Failed to fetch invoice");
                setInvoiceData(null);
                setOriginalData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [isOpen, bookingId]);

    // ─────────────────────────────── Derived state
    const isDirty = useMemo(() => {
        if (!invoiceData || !originalData) return false;
        return !deepEqual(invoiceData, originalData);
    }, [invoiceData, originalData]);

    const hasInvoice = Boolean(invoiceData?._id);
    const isBusy = loading || saving;
    const isStable = hasInvoice && !isDirty && !isBusy;

    // ─────────────────────────────── Buttons state
    const canReset = isDirty && !isBusy && hasInvoice;
    const canSave = isDirty && !isBusy && hasInvoice;
    const canView = isStable;
    const canRegenerate = !isBusy && Boolean(bookingId);

    // ─────────────────────────────── Helpers
    const handleFieldChange = (field, value) =>
        setInvoiceData((prev) => ({ ...prev, [field]: value }));

    const handleItemChange = (index, field, value) => {
        const updated = [...(invoiceData?.items || [])];
        updated[index] = {
            ...updated[index],
            [field]: field === "amount" ? Number(value) : value,
        };
        setInvoiceData((prev) => ({ ...prev, items: updated }));
    };

    const handleAddItem = () =>
        setInvoiceData((prev) => ({
            ...prev,
            items: [...(prev.items || []), { description: "", amount: 0 }],
        }));

    const calculateSubtotal = () =>
        (invoiceData?.items || []).reduce((sum, it) => sum + Number(it?.amount || 0), 0);

    const calculateDiscount = () => Number(invoiceData?.discountAmount || 0);

    const calculateVAT = () => {
        const afterDiscount = calculateSubtotal() - calculateDiscount();
        return invoiceData?.vatIncluded ? afterDiscount * 0.2 : 0;
    };

    const calculateTotal = () => {
        const afterDiscount = calculateSubtotal() - calculateDiscount();
        return afterDiscount + calculateVAT();
    };

    // ─────────────────────────────── Reset
    const handleReset = () => {
        if (!originalData) return;
        setInvoiceData(originalData);
        toast.info("Changes reset to last saved state");
    };

    // ─────────────────────────────── Save
    const confirmSave = async () => {
        if (!invoiceData?._id) {
            toast.error("Invoice ID missing, cannot update.");
            return;
        }
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
            toast.success("Invoice updated successfully");
            setShowSaveConfirm(false);
            onClose(); // ✅ auto-close after save
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to update invoice");
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────── View PDF
    const handleViewPdf = () => {
        if (!invoiceData?._id) {
            toast.error("Invoice ID missing, cannot open PDF.");
            return;
        }
        InvoiceApi.viewInvoicePdf(invoiceData._id);
    };

    // ─────────────────────────────── Regenerate
    const doRegenerate = async () => {
        try {
            setLoading(true);
            const regenerated = await InvoiceApi.generateInvoiceByBookingId(bookingId);
            setInvoiceData(regenerated);
            setOriginalData(regenerated);
            toast.success("Invoice regenerated successfully");
            setShowRegenConfirm(false);
            onClose(); // ✅ auto-close after regenerate
        } catch (err) {
            console.error("Failed to regenerate invoice", err);
            toast.error(err?.message || "Failed to regenerate invoice");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = () => {
        if (isDirty) {
            setShowRegenConfirm(true);
            return;
        }
        doRegenerate();
    };

    // ─────────────────────────────── Esc close
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col relative mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                >
                    <X size={22} />
                </button>

                {/* Scrollable content */}
                <div className="p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Invoice {invoiceData?.invoiceNo || ""}
                    </h2>

                    {loading ? (
                        <p className="text-center py-4">Loading invoice...</p>
                    ) : invoiceData ? (
                        <>
                            {/* Invoice details */}
                            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                                <div>
                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {invoiceData?.invoiceDate
                                            ? new Date(invoiceData.invoiceDate).toLocaleDateString()
                                            : "-"}
                                    </p>
                                    <label className="block mt-2">
                                        <strong>Status:</strong>
                                        <select
                                            className="ml-2 border rounded p-1"
                                            value={invoiceData.status || "Unpaid"}
                                            onChange={(e) =>
                                                handleFieldChange("status", e.target.value)
                                            }
                                            disabled={isBusy}
                                        >
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Partial">Partial</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <p>
                                        <strong>Customer:</strong>{" "}
                                        {invoiceData.customerName || "-"}
                                    </p>
                                    <p>
                                        <strong>Contact:</strong>{" "}
                                        {invoiceData.contactNo || "-"}
                                    </p>
                                    <p>
                                        <strong>Vehicle:</strong>{" "}
                                        {invoiceData.vehicleRegNo || "-"}{" "}
                                        {invoiceData.makeModel
                                            ? `(${invoiceData.makeModel})`
                                            : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Items table */}
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
                                        <th className="border p-2 text-left">Description</th>
                                        <th className="border p-2 text-right">Amount (£)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoiceData.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                <input
                                                    type="text"
                                                    className="w-full border rounded p-1"
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "description",
                                                            e.target.value
                                                        )
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
                                                        handleItemChange(
                                                            index,
                                                            "amount",
                                                            e.target.value
                                                        )
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
                                        <span>£{calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Discount:</span>
                                        <input
                                            type="number"
                                            className="w-24 border rounded p-1 text-right"
                                            value={invoiceData.discountAmount || 0}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "discountAmount",
                                                    Number(e.target.value || 0)
                                                )
                                            }
                                            disabled={isBusy}
                                        />
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>VAT (20%):</span>
                                        <span>£{calculateVAT().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-bold border-t mt-2 pt-2">
                                        <span>Total:</span>
                                        <span>£{calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(invoiceData.vatIncluded)}
                                            onChange={(e) =>
                                                handleFieldChange("vatIncluded", e.target.checked)
                                            }
                                            disabled={isBusy}
                                        />
                                        VAT Included
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-center py-4 text-gray-500">
                            No invoice found for this booking.
                        </p>
                    )}
                </div>

                {/* Sticky Footer */}
                <div className="flex flex-wrap justify-end gap-2 p-4 border-t bg-gray-50">
                    <button
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
                        onClick={handleRegenerate}
                        disabled={!canRegenerate}
                        title={isDirty ? "Regenerating will discard unsaved changes" : ""}
                    >
                        Regenerate
                    </button>
                    <button
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
                        onClick={handleReset}
                        disabled={!canReset}
                    >
                        Reset
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                        onClick={() => setShowSaveConfirm(true)}
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
                </div>

                {/* Save confirm */}
                {showSaveConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded shadow-lg max-w-sm">
                            <p className="mb-4 text-center">
                                Are you sure you want to save changes to this invoice?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded"
                                    onClick={() => setShowSaveConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                    onClick={confirmSave}
                                >
                                    Confirm Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Regenerate confirm */}
                {showRegenConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded shadow-lg max-w-sm">
                            <p className="mb-4 text-center">
                                Regenerating will discard your unsaved changes. Continue?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded"
                                    onClick={() => setShowRegenConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-purple-600 text-white rounded"
                                    onClick={doRegenerate}
                                >
                                    Yes, Regenerate
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
