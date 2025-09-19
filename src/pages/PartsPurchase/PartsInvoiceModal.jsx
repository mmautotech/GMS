import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { getParts } from "../../lib/api/partsApi.js";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";

export default function PartsInvoiceModal({ isOpen, onClose, invoiceId }) {
    const [invoice, setInvoice] = useState(null);
    const [allParts, setAllParts] = useState([]);
    const [applyVAT, setApplyVAT] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const partsRes = await getParts({ includeInactive: true });
                setAllParts(partsRes?.parts || partsRes?.data || []);
            } catch (err) {
                toast.error("Failed to fetch parts");
            }
        };
        fetchParts();
    }, []);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!invoiceId) return;
            setLoading(true);
            try {
                const res = await PurchasePartsApi.getInvoiceById(invoiceId);
                setInvoice(res?.data || null);
                setApplyVAT(res?.data?.vatIncluded ?? true);
            } catch (err) {
                toast.error("Failed to fetch invoice");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId]);

    const supplierParts = allParts.filter(
        (p) => p.supplier?._id === invoice?.supplier?._id
    );

    const getPartName = (partId) => {
        if (!partId) return "N/A";
        const found = allParts.find((p) => p._id === (partId._id || partId));
        return found ? found.partName : "N/A";
    };

    const calculateTotal = () =>
        invoice?.items?.reduce(
            (sum, item) =>
                sum +
                (Number(item.quantity) || 0) * (Number(item.rate) || 0),
            0
        ) || 0;

    const calculateDiscount = (total) =>
        Number(invoice?.discount || 0);

    const calculateVAT = (total, discount) =>
        applyVAT ? ((total - discount) * 20) / 100 : 0;

    const calculateNetTotal = () => {
        const total = calculateTotal();
        const discount = calculateDiscount(total);
        const vat = calculateVAT(total, discount);
        return total - discount + vat;
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...invoice.items];
        if (field === "quantity" || field === "rate") {
            updatedItems[index][field] = value === "" ? "" : Number(value);
        } else {
            updatedItems[index][field] = value;
        }
        setInvoice({ ...invoice, items: updatedItems });
    };

    const handleAddItem = () => {
        setInvoice({
            ...invoice,
            items: [...(invoice.items || []), { part: "", quantity: 1, rate: 0 }],
        });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...invoice.items];
        updatedItems.splice(index, 1);
        setInvoice({ ...invoice, items: updatedItems });
    };

    const handleSave = async () => {
        if (!invoice) return;
        if (!invoice.items.length || invoice.items.some((i) => !i.part))
            return toast.error("Please select at least one part");

        setSaving(true);
        try {
            const payload = {
                supplier:
                    typeof invoice.supplier === "object"
                        ? invoice.supplier._id
                        : invoice.supplier,
                vendorInvoiceNumber: invoice.vendorInvoiceNumber,
                paymentStatus: invoice.paymentStatus || "Pending",
                paymentDate: invoice.paymentDate
                    ? new Date(invoice.paymentDate).toISOString()
                    : null,
                discount: Number(invoice.discount) || 0,
                vatIncluded: Boolean(applyVAT),
                items: invoice.items.map((item) => ({
                    part: typeof item.part === "object" ? item.part._id : item.part,
                    quantity: Number(item.quantity) || 0,
                    rate: Number(item.rate) || 0,
                })),
            };

            const res = await PurchasePartsApi.updateInvoice(invoice._id, payload);

            if (res.success) {
                toast.success("Invoice updated successfully");
                setInvoice(res.data);
            } else {
                toast.error(res.error || "Failed to update invoice");
            }
        } catch (err) {
            console.error(err.response || err);
            toast.error(err.response?.data?.error || "Failed to update invoice");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] md:max-w-4xl rounded-xl shadow-xl p-6 bg-gray-50">
                <DialogHeader className="sticky top-0 bg-gray-50 z-10">
                    <DialogTitle className="text-2xl font-bold border-b border-gray-200 pb-3">
                        {loading
                            ? "Loading..."
                            : `Invoice #${invoice?.vendorInvoiceNumber || ""}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[80vh] overflow-y-auto mt-4 space-y-6">
                    {loading ? (
                        <p className="text-center py-12 text-gray-500">Loading invoice...</p>
                    ) : !invoice ? (
                        <p className="text-center py-12 text-gray-500">Invoice not found</p>
                    ) : (
                        <>
                            {/* Supplier Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Supplier</Label>
                                    <Input
                                        value={invoice?.supplier?.name || ""}
                                        onChange={(e) =>
                                            setInvoice({
                                                ...invoice,
                                                supplier: { ...invoice.supplier, name: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Contact</Label>
                                    <Input
                                        value={invoice?.supplier?.contact || ""}
                                        onChange={(e) =>
                                            setInvoice({
                                                ...invoice,
                                                supplier: { ...invoice.supplier, contact: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Invoice Info */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Vendor Invoice #</Label>
                                    <Input
                                        value={invoice.vendorInvoiceNumber || ""}
                                        onChange={(e) =>
                                            setInvoice({ ...invoice, vendorInvoiceNumber: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Date</Label>
                                    <Input
                                        type="date"
                                        value={
                                            invoice.paymentDate
                                                ? new Date(invoice.paymentDate).toISOString().split("T")[0]
                                                : ""
                                        }
                                        onChange={(e) =>
                                            setInvoice({ ...invoice, paymentDate: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Payment Status</Label>
                                    <select
                                        value={invoice.paymentStatus || "Pending"}
                                        onChange={(e) =>
                                            setInvoice({ ...invoice, paymentStatus: e.target.value })
                                        }
                                        className="border rounded px-2 py-1 w-full"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <Label className="font-semibold mb-1 block">Net Total</Label>
                                    <Input value={calculateNetTotal()} disabled className="font-bold" />
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <Label className="font-semibold mb-2 block">Items</Label>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-3 py-2 text-left">#</th>
                                                <th className="border px-3 py-2 text-left">Part</th>
                                                <th className="border px-3 py-2 text-left">Quantity</th>
                                                <th className="border px-3 py-2 text-left">Unit Price</th>
                                                <th className="border px-3 py-2 text-left">Subtotal</th>
                                                <th className="border px-3 py-2 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.items?.length > 0 ? (
                                                invoice.items.map((item, idx) => {
                                                    const subtotal =
                                                        (Number(item.quantity) || 0) *
                                                        (Number(item.rate) || 0);
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="border px-3 py-2">{idx + 1}</td>
                                                            <td className="border px-3 py-2">
                                                                <select
                                                                    value={item.part?._id || item.part || ""}
                                                                    onChange={(e) =>
                                                                        handleItemChange(idx, "part", e.target.value)
                                                                    }
                                                                    className="border rounded px-2 py-1 w-full"
                                                                >
                                                                    <option value="">Select Part</option>
                                                                    {item.part &&
                                                                        !supplierParts.some(
                                                                            (p) =>
                                                                                p._id ===
                                                                                (item.part?._id || item.part)
                                                                        ) && (
                                                                            <option
                                                                                value={item.part?._id || item.part}
                                                                            >
                                                                                {getPartName(item.part?._id || item.part)}
                                                                            </option>
                                                                        )}
                                                                    {supplierParts.map((p) => (
                                                                        <option key={p._id} value={p._id}>
                                                                            {p.partName} ({p.partNumber})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="border px-3 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        handleItemChange(idx, "quantity", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="border px-3 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={item.rate}
                                                                    onChange={(e) =>
                                                                        handleItemChange(idx, "rate", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="border px-3 py-2 font-semibold">
                                                                £{subtotal.toFixed(2)}
                                                            </td>
                                                            <td className="border px-3 py-2">
                                                                <Button
                                                                    onClick={() => handleRemoveItem(idx)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4 text-gray-400">
                                                        No items added
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Button
                                    onClick={handleAddItem}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 mt-3 rounded"
                                >
                                    Add Item
                                </Button>
                            </div>

                            {/* Discount & VAT */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4">
                                {/* Discount */}
                                <div className="flex-1">
                                    <Label className="font-semibold mb-1 block">Discount (£)</Label>
                                    <Input
                                        type="number"
                                        value={invoice.discount || ""}
                                        onChange={(e) =>
                                            setInvoice({ ...invoice, discount: e.target.value === "" ? "" : Number(e.target.value) })
                                        }
                                    />
                                </div>

                                {/* VAT */}
                                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                                    <input
                                        type="checkbox"
                                        checked={applyVAT}
                                        onChange={() => setApplyVAT(!applyVAT)}
                                        className="mr-2"
                                    />
                                    <span className="font-medium">Apply VAT (20%)</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-4">
                                <Button
                                    onClick={onClose}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
