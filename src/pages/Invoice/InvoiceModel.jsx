// src/components/InvoiceModal.jsx
import React, { useEffect, useState } from "react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { toast } from "react-toastify";

// Simple deep comparison
const deepEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

export default function InvoiceModal({ bookingId, isOpen, onClose }) {
    const [invoiceData, setInvoiceData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

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
                    toast.info("No invoice found for this booking");
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

    // Update isDirty when invoiceData changes
    useEffect(() => {
        if (invoiceData && originalData) {
            setIsDirty(!deepEqual(invoiceData, originalData));
        }
    }, [invoiceData, originalData]);

    const handleFieldChange = (field, value) => {
        setInvoiceData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...(invoiceData.items || [])];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: field === "amount" ? Number(value) : value,
        };
        setInvoiceData(prev => ({ ...prev, items: updatedItems }));
    };

    const handleAddItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...(prev.items || []), { description: "", amount: 0 }],
        }));
    };

    const calculateSubtotal = () =>
        (invoiceData.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const calculateDiscount = () => Number(invoiceData.discountAmount || 0);

    const calculateVAT = () => {
        const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
        return invoiceData.vatIncluded ? subtotalAfterDiscount * 0.2 : 0;
    };

    const calculateTotal = () => {
        const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
        return subtotalAfterDiscount + calculateVAT();
    };

    const handleReset = () => {
        if (originalData) {
            setInvoiceData(originalData);
            toast.info("Changes reset to last saved state");
        }
    };

    const confirmSave = async () => {
        if (!invoiceData?._id) {
            toast.error("Invoice ID missing, cannot update.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                items: invoiceData.items,
                discountAmount: invoiceData.discountAmount,
                vatIncluded: invoiceData.vatIncluded,
                status: invoiceData.status,
            };

            const updated = await InvoiceApi.updateInvoice(invoiceData._id, payload);
            setInvoiceData(updated);
            setOriginalData(updated);

            toast.success("Invoice updated successfully");
            setShowConfirm(false);
        } catch (err) {
            toast.error(err.message || "Failed to update invoice");
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!invoiceData?._id) {
            toast.error("Invoice ID missing, cannot download.");
            return;
        }
        try {
            await InvoiceApi.downloadInvoicePdf(
                invoiceData._id,
                `${invoiceData.invoiceNo || "invoice"}.pdf`
            );
            toast.success("Invoice PDF downloaded");
        } catch (err) {
            toast.error(err.message || "Failed to download invoice PDF");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg w-3/4 max-w-3xl p-6 relative">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Invoice {invoiceData?.invoiceNo || ""}
                </h2>

                {loading ? (
                    <p className="text-center py-4">Loading invoice...</p>
                ) : invoiceData ? (
                    <>
                        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                            <div>
                                <p>
                                    <strong>Date:</strong>{" "}
                                    {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                                </p>
                                <label className="block mt-2">
                                    <strong>Status:</strong>
                                    <select
                                        className="ml-2 border rounded p-1"
                                        value={invoiceData.status}
                                        onChange={e =>
                                            handleFieldChange("status", e.target.value)
                                        }
                                    >
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </label>
                            </div>
                            <div>
                                <p><strong>Customer:</strong> {invoiceData.customerName}</p>
                                <p><strong>Contact:</strong> {invoiceData.contactNo}</p>
                                <p><strong>Vehicle:</strong> {invoiceData.vehicleRegNo} ({invoiceData.makeModel})</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm mb-2"
                            onClick={handleAddItem}
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
                                                onChange={e =>
                                                    handleItemChange(index, "description", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td className="border p-2 text-right">
                                            <input
                                                type="number"
                                                className="w-24 border rounded p-1 text-right"
                                                value={item.amount}
                                                onChange={e =>
                                                    handleItemChange(index, "amount", e.target.value)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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
                                        className="w-20 border rounded p-1 text-right"
                                        value={invoiceData.discountAmount}
                                        onChange={e =>
                                            handleFieldChange("discountAmount", e.target.value)
                                        }
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
                                        checked={invoiceData.vatIncluded}
                                        onChange={e =>
                                            handleFieldChange("vatIncluded", e.target.checked)
                                        }
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

                <div className="flex justify-end mt-6 gap-2">
                    <button
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        disabled={!isDirty}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
                        onClick={handleReset}
                    >
                        Reset Changes
                    </button>
                    <button
                        disabled={saving || !invoiceData?._id || !isDirty}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                        onClick={() => setShowConfirm(true)}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                        disabled={isDirty || !invoiceData?._id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                        onClick={handleDownload}
                    >
                        Download PDF
                    </button>
                </div>

                {showConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded shadow-lg max-w-sm">
                            <p className="mb-4 text-center">
                                Are you sure you want to save changes to this invoice?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded"
                                    onClick={() => setShowConfirm(false)}
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
            </div>
        </div>
    );
}
