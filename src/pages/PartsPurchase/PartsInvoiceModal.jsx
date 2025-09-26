// src/pages/PartsPurchase/PartsInvoiceModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js";
import axiosInstance from "../../lib/api/axiosInstance.js";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";

export default function PartsInvoiceModal({ invoiceId = null, isOpen, onClose }) {
    const [suppliers, setSuppliers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        supplier: "",
        vehicleRegNo: "",
        booking: null,
        items: [{ partName: "", partNumber: "", rate: 0, quantity: 1 }],
        paymentDate: new Date().toISOString().slice(0, 10),
        discount: 0,
        vatIncluded: true,
        vendorInvoiceNumber: "",
    });

    // Fetch suppliers
    useEffect(() => {
        getSuppliers()
            .then(res => setSuppliers(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error("Failed to fetch suppliers"));
    }, []);

    // Fetch arrived bookings
    useEffect(() => {
        async function fetchBookings() {
            try {
                const res = await axiosInstance.get("/bookings/arrived");
                if (res.data?.success) {
                    setBookings(res.data.data || []);
                }
            } catch (err) {
                toast.error("Failed to fetch arrived bookings");
            }
        }
        fetchBookings();
    }, []);

    // Fetch invoice if editing
    useEffect(() => {
        if (invoiceId) {
            setLoading(true);
            PurchasePartsApi.getInvoiceById(invoiceId)
                .then(res => {
                    if (res.success) {
                        setFormData({
                            supplier: res.data.supplier?._id || "",
                            vehicleRegNo: res.data.vehicleRegNo || "",
                            booking: res.data.booking?._id || null,
                            items: res.data.items || [{ partName: "", partNumber: "", rate: 0, quantity: 1 }],
                            paymentDate: res.data.paymentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                            discount: res.data.discount || 0,
                            vatIncluded: res.data.vatIncluded ?? true,
                            vendorInvoiceNumber: res.data.vendorInvoiceNumber || "",
                        });
                    }
                })
                .catch(() => toast.error("Failed to load invoice"))
                .finally(() => setLoading(false));
        }
    }, [invoiceId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search for vehicle reg
    useEffect(() => {
        const handler = setTimeout(() => {
            const search = formData.vehicleRegNo.toLowerCase();
            if (!search) {
                setFilteredBookings([]);
                setShowDropdown(false);
                return;
            }
            const matches = bookings.filter(b => b.vehicleRegNo.toLowerCase().includes(search));
            setFilteredBookings(matches);
            setShowDropdown(matches.length > 0);
            setHighlightIndex(0);

            // Reset booking id if text does not match any booking
            if (formData.booking && formData.vehicleRegNo.toLowerCase() !== bookings.find(b => b._id === formData.booking)?.vehicleRegNo.toLowerCase()) {
                setFormData(prev => ({ ...prev, booking: null }));
            }
        }, 200);
        return () => clearTimeout(handler);
    }, [formData.vehicleRegNo, bookings, formData.booking]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSelectBooking = (b) => {
        setFormData(prev => ({
            ...prev,
            vehicleRegNo: b.vehicleRegNo,
            booking: b._id,
        }));
        setShowDropdown(false);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;
        if (e.key === "ArrowDown") {
            setHighlightIndex(prev => (prev + 1) % filteredBookings.length);
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            setHighlightIndex(prev => (prev - 1 + filteredBookings.length) % filteredBookings.length);
            e.preventDefault();
        } else if (e.key === "Enter") {
            handleSelectBooking(filteredBookings[highlightIndex]);
            e.preventDefault();
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === "rate" || field === "quantity" ? Number(value) || 0 : value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { partName: "", partNumber: "", rate: 0, quantity: 1 }],
        }));
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSave = async () => {
        if (!formData.supplier) return toast.error("Please select a supplier");
        if (!formData.items.length || formData.items.some(i => !i.partName)) return toast.error("Please provide at least one part");
        if (!formData.vendorInvoiceNumber) return toast.error("Please provide a vendor invoice number");
        if (formData.items.some(i => i.rate <= 0 || i.quantity <= 0)) return toast.error("Rate and Quantity must be greater than zero");

        try {
            if (invoiceId) {
                await PurchasePartsApi.updateInvoice(invoiceId, formData);
                toast.success("Invoice updated successfully");
            } else {
                await PurchasePartsApi.createInvoice(formData);
                toast.success("Invoice created successfully");
            }
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to save invoice");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl rounded-lg shadow-lg p-6 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {invoiceId ? "Edit Invoice" : "Create New Invoice"}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-6">Loading...</div>
                ) : (
                    <div className="space-y-4 mt-2">
                        {/* Supplier */}
                        <div className="space-y-1">
                            <Label>Supplier</Label>
                            <select
                                value={formData.supplier}
                                onChange={handleInputChange}
                                name="supplier"
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle Registration - Searchable */}
                        <div className="space-y-1 relative" ref={dropdownRef}>
                            <Label>Vehicle Registration</Label>
                            <Input
                                name="vehicleRegNo"
                                value={formData.vehicleRegNo}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to search vehicle reg..."
                            />
                            {showDropdown && (
                                <ul className="absolute z-10 w-full bg-white border rounded max-h-40 overflow-y-auto mt-1">
                                    {filteredBookings.map((b, idx) => (
                                        <li
                                            key={b._id}
                                            className={`px-3 py-2 cursor-pointer ${highlightIndex === idx ? "bg-blue-100" : ""}`}
                                            onClick={() => handleSelectBooking(b)}
                                        >
                                            {b.vehicleRegNo} {b.ownerName ? `- ${b.ownerName}` : ""}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left">Part Name</th>
                                        <th className="p-2 text-left">Part Number</th>
                                        <th className="p-2 text-left">Rate (£)</th>
                                        <th className="p-2 text-left">Qty</th>
                                        <th className="p-2 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-2">
                                                <Input
                                                    value={item.partName}
                                                    onChange={(e) => handleItemChange(idx, "partName", e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={item.partNumber}
                                                    onChange={(e) => handleItemChange(idx, "partNumber", e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Button
                                                    onClick={() => removeItem(idx)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Button
                            onClick={addItem}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2"
                        >
                            Add Another Part
                        </Button>

                        {/* Invoice Info */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <Label>Vendor Invoice Number</Label>
                                <Input
                                    name="vendorInvoiceNumber"
                                    value={formData.vendorInvoiceNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <Label>Payment Date</Label>
                                <Input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <Label>Discount (£)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    type="checkbox"
                                    id="vatIncluded"
                                    name="vatIncluded"
                                    checked={formData.vatIncluded}
                                    onChange={handleInputChange}
                                    className="accent-blue-600"
                                />
                                <Label htmlFor="vatIncluded">VAT Included</Label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-4">
                            <Button
                                onClick={onClose}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                {invoiceId ? "Update Invoice" : "Create Invoice"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}