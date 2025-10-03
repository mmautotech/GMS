// src/pages/PartsPurchase/PartsInvoiceModal.jsx
import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

import { useSuppliers } from "../../hooks/useSuppliers.js";
import { useBookingMap } from "../../hooks/useBookingMap.js";
import { usePurchaseInvoice } from "../../hooks/usePurchaseInvoice.js";
import useBookingParts from "../../hooks/useBookingParts.js";

const currencyFmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
});

const today = new Date().toISOString().slice(0, 10);

const defaultForm = {
    supplier: "",
    booking: "",
    items: [{ part: "", rate: 0, quantity: 1 }],
    paymentDate: today,
    vatIncluded: true,
    vendorInvoiceNumber: "",
    paymentStatus: "Unpaid",
    discount: 0,
};

const PartsInvoiceModal = forwardRef(function PartsInvoiceModal(
    { isOpen, onClose, invoiceId },
    ref
) {
    const { suppliers, loading: suppliersLoading } = useSuppliers();
    const { invoice, loading: invoiceLoading, createInvoice, updateInvoice } =
        usePurchaseInvoice(invoiceId);
    const { map: bookingMap, loading: bookingMapLoading, error: bookingMapError } =
        useBookingMap();

    const [formData, setFormData] = useState(defaultForm);

    // ✅ Fetch parts for selected booking
    const { parts, loading: partsLoading } = useBookingParts(formData.booking, {
        enabled: !!formData.booking,
    });

    const [visible, setVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const initialReadyRef = useRef(false);

    // Animate modal in/out
    useEffect(() => {
        if (isOpen) setVisible(true);
        else {
            const timeout = setTimeout(() => setVisible(false), 200);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    // ✅ Populate form when editing
    useEffect(() => {
        if (!isOpen) return;
        if (!invoiceId) {
            setFormData(defaultForm);
        } else if (invoice) {
            setFormData({
                supplier: invoice.supplier?._id || invoice.supplier || "",
                booking: invoice.booking?._id || invoice.booking?.id || "",
                items:
                    invoice.items?.map((i) => ({
                        // 🔑 normalize part id for dropdown
                        part: i.part?._id || i.part?.id || i.part || "",
                        rate: Number(i.rate) || 0,
                        quantity: Number(i.quantity) || 1,
                    })) || defaultForm.items,
                paymentDate: invoice.paymentDate?.slice(0, 10) || today,
                vatIncluded: invoice.vatIncluded ?? true,
                vendorInvoiceNumber: invoice.vendorInvoiceNumber || "",
                paymentStatus: invoice.paymentStatus || "Unpaid",
                discount: Number(invoice.discount) || 0,
            });
        }
    }, [isOpen, invoiceId, invoice]);

    // Escape key closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => e.key === "Escape" && !saving && onClose();
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose, saving]);

    const bootReady =
        !suppliersLoading &&
        !partsLoading &&
        !bookingMapLoading &&
        (!invoiceId || !invoiceLoading);

    useEffect(() => {
        if (!isOpen) {
            initialReadyRef.current = false;
            return;
        }
        if (bootReady && !initialReadyRef.current) {
            initialReadyRef.current = true;
        }
    }, [isOpen, bootReady]);

    // ✅ Reset invalid parts when booking changes
    useEffect(() => {
        if (formData.booking && !partsLoading) {
            setFormData((prev) => ({
                ...prev,
                items: prev.items.map((i) => ({
                    ...i,
                    part: parts.find((p) => p._id === i.part)?._id || i.part, // 🔑 keep value if valid
                })),
            }));
        }
    }, [formData.booking, partsLoading, parts]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleItemChange = (idx, field, value) => {
        const newItems = [...formData.items];
        newItems[idx][field] =
            field === "rate" || field === "quantity"
                ? Math.max(0, Number(value) || 0)
                : value;
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addItem = () =>
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { part: "", rate: 0, quantity: 1 }],
        }));

    const removeItem = (idx) => {
        if (formData.items.length === 1) return;
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const handleSave = async () => {
        if (!formData.supplier) return toast.error("Please select a supplier");
        if (!formData.booking) return toast.error("Please select a vehicle");
        if (!formData.items.length || formData.items.some((i) => !i.part))
            return toast.error("Please provide at least one part");
        if (!formData.vendorInvoiceNumber)
            return toast.error("Please provide a vendor invoice number");
        if (formData.items.some((i) => i.rate <= 0 || i.quantity <= 0))
            return toast.error("Rate and Quantity must be greater than zero");

        setSaving(true);
        try {
            let payload = { ...formData };

            if (invoiceId) {
                const { booking, ...rest } = payload;
                payload = rest;
            }

            const res = invoiceId
                ? await updateInvoice(payload)
                : await createInvoice(payload);

            if (res.success) onClose();
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({ refresh: () => { } }));

    if (!visible) return null;

    const localTotal = formData.items.reduce(
        (sum, i) => sum + (Number(i.rate) || 0) * (Number(i.quantity) || 0),
        0
    );
    const discounted = Math.max(0, localTotal - (Number(formData.discount) || 0));
    const finalTotal = formData.vatIncluded ? discounted * 1.2 : discounted;

    const showBootOverlay = isOpen && invoiceId && !initialReadyRef.current;

    const canSelectSupplier = !!formData.booking;
    const canSelectParts = !!formData.supplier;
    const canCreateInvoice =
        !!formData.booking &&
        !!formData.supplier &&
        formData.items.some((i) => i.part) &&
        !!formData.vendorInvoiceNumber;

    return (
        <div
            aria-hidden={!isOpen}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            onClick={() => !showBootOverlay && !saving && onClose()}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 relative transform transition-all duration-200 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                style={{ maxHeight: "90vh" }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Loader overlay */}
                {(showBootOverlay || saving) && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 rounded-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                        <span className="text-gray-700 font-medium">
                            {saving ? "Saving invoice…" : "Preparing invoice…"}
                        </span>
                    </div>
                )}

                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {invoiceId ? "Edit Invoice" : "Create New Invoice"}
                    </h2>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
                    {/* Vehicle */}
                    <div className="space-y-1 mb-4">
                        <Label>Vehicle</Label>
                        {invoiceId ? (
                            <input
                                type="text"
                                value={bookingMap.find((b) => b.id === formData.booking)?.label || "N/A"}
                                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
                                disabled
                            />
                        ) : (
                            <select
                                name="booking"
                                value={formData.booking || ""}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                disabled={bookingMapLoading || showBootOverlay || saving}
                            >
                                <option value="">Select Vehicle</option>
                                {bookingMap.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        {bookingMapError && (
                            <p className="text-sm text-red-600">{bookingMapError}</p>
                        )}
                    </div>

                    {/* Supplier */}
                    <div className="space-y-1 mb-4">
                        <Label>Supplier</Label>
                        <select
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleInputChange}
                            className="w-full border rounded px-3 py-2"
                            disabled={!canSelectSupplier || suppliersLoading || showBootOverlay || saving}
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Items */}
                    <div className="mb-4 max-h-[300px] overflow-y-auto border rounded-lg">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 text-left">Part</th>
                                    <th className="p-2 text-left">Rate (£)</th>
                                    <th className="p-2 text-left">Qty</th>
                                    <th className="p-2 text-left">Total (£)</th>
                                    <th className="p-2 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, idx) => {
                                    const rowTotal =
                                        (Number(item.rate) || 0) *
                                        (Number(item.quantity) || 0);
                                    return (
                                        <tr key={idx} className="border-t">
                                            <td className="p-2">
                                                <select
                                                    value={item.part}
                                                    onChange={(e) =>
                                                        handleItemChange(idx, "part", e.target.value)
                                                    }
                                                    className="w-full border rounded px-2 py-1"
                                                    disabled={!canSelectParts || partsLoading || showBootOverlay || saving}
                                                >
                                                    <option value="">Select Part</option>
                                                    {partsLoading && (
                                                        <option disabled>Loading parts…</option>
                                                    )}
                                                    {!partsLoading && parts.length === 0 && (
                                                        <option disabled>No parts available</option>
                                                    )}
                                                    {parts.map((p) => (
                                                        <option key={p._id} value={p._id}>
                                                            {p.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={item.rate}
                                                    onChange={(e) =>
                                                        handleItemChange(idx, "rate", e.target.value)
                                                    }
                                                    disabled={!canSelectParts || showBootOverlay || saving}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleItemChange(idx, "quantity", e.target.value)
                                                    }
                                                    disabled={!canSelectParts || showBootOverlay || saving}
                                                />
                                            </td>
                                            <td className="p-2">{currencyFmt.format(rowTotal)}</td>
                                            <td className="p-2">
                                                <Button
                                                    onClick={() => removeItem(idx)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                                    disabled={
                                                        formData.items.length === 1 ||
                                                        !canSelectParts ||
                                                        showBootOverlay ||
                                                        saving
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-100 font-semibold border-t-2 sticky bottom-0">
                                    <td className="p-2" colSpan={3}>Total</td>
                                    <td className="p-2">{currencyFmt.format(finalTotal)}</td>
                                    <td />
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <Button
                        onClick={addItem}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-6"
                        disabled={!canSelectParts || showBootOverlay || saving}
                    >
                        Add Another Part
                    </Button>

                    {/* Discount + VAT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <Label>Discount (£)</Label>
                            <Input
                                type="number"
                                min={0}
                                name="discount"
                                value={formData.discount}
                                onChange={handleInputChange}
                                disabled={showBootOverlay || saving}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-6">
                            <input
                                type="checkbox"
                                id="vatIncluded"
                                name="vatIncluded"
                                checked={formData.vatIncluded}
                                onChange={handleInputChange}
                                className="accent-blue-600"
                                disabled={showBootOverlay || saving}
                            />
                            <Label htmlFor="vatIncluded">VAT Included</Label>
                        </div>
                    </div>

                    {/* Invoice Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label>Vendor Invoice Number</Label>
                            <Input
                                name="vendorInvoiceNumber"
                                value={formData.vendorInvoiceNumber}
                                onChange={handleInputChange}
                                disabled={!canSelectParts || showBootOverlay || saving}
                            />
                        </div>
                        <div>
                            <Label>Payment Date</Label>
                            <Input
                                type="date"
                                name="paymentDate"
                                value={formData.paymentDate}
                                onChange={handleInputChange}
                                disabled={showBootOverlay || saving}
                            />
                        </div>
                        <div>
                            <Label>Payment Status</Label>
                            <select
                                name="paymentStatus"
                                value={formData.paymentStatus}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                disabled={showBootOverlay || saving}
                            >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partial">Partial</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                    <Button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                        disabled={showBootOverlay || saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        disabled={!canCreateInvoice || showBootOverlay || saving}
                    >
                        {invoiceId ? "Update Invoice" : "Create Invoice"}
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default PartsInvoiceModal;
