import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";

export default function PartsInvoiceModal({ invoiceId, isOpen, onClose }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allParts, setAllParts] = useState([]);
    const [formData, setFormData] = useState({
        supplier: "",
        items: [],
        paymentDate: "",
        discount: 0,
        vatIncluded: true,
        vendorInvoiceNumber: "",
        paymentStatus: "Pending",
    });

    // Fetch invoice by ID
    const fetchInvoice = async () => {
        if (!invoiceId) return;
        setLoading(true);
        try {
            const res = await PurchasePartsApi.getInvoiceById(invoiceId);
            if (res.success) {
                const data = res.data || {};
                setInvoice(data);
                setFormData({
                    supplier: data.supplier?._id || "",
                    items: Array.isArray(data.items)
                        ? data.items.map((item) => ({
                            part: item.part?._id || item.part,
                            rate: item.rate || 0,
                            quantity: item.quantity || 1,
                        }))
                        : [],
                    paymentDate: data.paymentDate
                        ? new Date(data.paymentDate).toISOString().slice(0, 10)
                        : "",
                    discount: data.discount || 0,
                    vatIncluded: data.vatIncluded ?? true,
                    vendorInvoiceNumber: data.vendorInvoiceNumber || "",
                    paymentStatus: data.paymentStatus || "Pending",
                });
            } else {
                toast.error(res.error || "Failed to fetch invoice");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch invoice");
        } finally {
            setLoading(false);
        }
    };

    // Fetch all parts for dropdown
    const fetchAllParts = async () => {
        try {
            const res = await PurchasePartsApi.getAllParts();
            setAllParts(res.parts || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchInvoice();
            fetchAllParts();
        }
    }, [invoiceId, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] =
            field === "rate" || field === "quantity" ? Number(value) : value;
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { part: "", rate: 0, quantity: 1 }],
        }));
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const handleUpdateInvoice = async () => {
        if (!formData.items.length || formData.items.some((i) => !i.part))
            return toast.error("Please select a part for each item");

        try {
            const res = await PurchasePartsApi.updateInvoice(invoiceId, formData);
            if (res.success) {
                toast.success("Invoice updated successfully");
                setInvoice(res.data);
                onClose();
            } else {
                toast.error(res.error || "Failed to update invoice");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update invoice");
        }
    };

    const subtotal = formData.items.reduce((sum, i) => sum + i.rate * i.quantity, 0);
    const vatAmount = formData.vatIncluded ? subtotal * 0.2 : 0; // 20% VAT
    const total = subtotal - formData.discount + vatAmount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-xl shadow-xl p-6 bg-white">
                <DialogHeader className="sticky top-0 bg-white z-10">
                    <DialogTitle className="text-2xl font-bold border-b pb-2">
                        {loading ? "Loading..." : `Invoice #${invoice?.vendorInvoiceNumber || ""}`}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <p className="text-center py-12 text-gray-400">Loading invoice...</p>
                ) : !invoice ? (
                    <p className="text-center py-12 text-gray-400">Invoice not found</p>
                ) : (
                    <div className="space-y-6 mt-4">
                        {/* Supplier & Payment Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Supplier</Label>
                                <Input
                                    value={invoice?.supplier?.name || ""}
                                    disabled
                                    className="w-full bg-gray-100"
                                />
                            </div>
                            <div>
                                <Label>Payment Status</Label>
                                <Input
                                    name="paymentStatus"
                                    value={formData.paymentStatus || "Pending"}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Parts Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-1">Parts</h3>
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-5 gap-4 items-end">
                                    <div>
                                        <Label>Part</Label>
                                        <select
                                            value={item.part || ""}
                                            onChange={(e) => handleItemChange(idx, "part", e.target.value)}
                                            className="w-full border rounded-md px-3 py-2"
                                        >
                                            <option value="">Select Part</option>
                                            {allParts.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.partName} ({p.partNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Rate (£)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={item.rate || 0}
                                            onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity || 1}
                                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Total (£)</Label>
                                        <Input
                                            value={(item.rate * item.quantity).toFixed(2)}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => removeItem(idx)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                onClick={addItem}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mt-2"
                            >
                                Add Another Part
                            </Button>
                        </div>

                        {/* Invoice Info & Totals */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label>Vendor Invoice Number</Label>
                                <Input
                                    name="vendorInvoiceNumber"
                                    value={formData.vendorInvoiceNumber || ""}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <Label>Payment Date</Label>
                                <Input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate || ""}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <Label>Discount (£)</Label>
                                <Input
                                    type="number"
                                    name="discount"
                                    value={formData.discount || 0}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    type="checkbox"
                                    id="vatIncluded"
                                    name="vatIncluded"
                                    checked={formData.vatIncluded || false}
                                    onChange={handleInputChange}
                                    className="accent-blue-600"
                                />
                                <Label htmlFor="vatIncluded">VAT Included</Label>
                            </div>

                            {/* Totals */}
                            <div className="col-span-2 border-t pt-2 text-right space-y-1">
                                <p>Subtotal: £{subtotal.toFixed(2)}</p>
                                <p>Discount: £{formData.discount.toFixed(2)}</p>
                                <p>VAT ({formData.vatIncluded ? "Included" : "Not Included"}): £{vatAmount.toFixed(2)}</p>
                                <p className="font-bold">Total: £{total.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                onClick={onClose}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateInvoice}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Update Invoice
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
