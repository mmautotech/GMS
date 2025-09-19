import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js";
import { getParts } from "../../lib/api/partsApi.js";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../ui/dialog";
import { Plus, Eye } from "lucide-react";
import Pagination from "../../components/Pagination.jsx";
import PartsInvoiceModal from "./PartsInvoiceModal.jsx";

export default function PartsPurchase() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(5);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterSupplier, setFilterSupplier] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [parts, setParts] = useState([]);
    const [formData, setFormData] = useState({
        supplier: "",
        items: [{ part: "", rate: 0, quantity: 1 }],
        paymentDate: new Date().toISOString().slice(0, 10),
        discount: 0,
        vatIncluded: true,
        vendorInvoiceNumber: "",
    });

    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Fetch suppliers & parts once
    useEffect(() => {
        fetchSuppliers();
        fetchParts();
    }, []);

    const fetchInvoices = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const res = await PurchasePartsApi.getMyInvoices({
                page: pageNumber,
                limit: pageSize,
                supplier: filterSupplier || undefined,
                status: filterStatus || undefined,
                partName: searchTerm || undefined,
            });

            if (res.success) {
                setInvoices(Array.isArray(res.data) ? res.data : []);
                setTotalPages(res.meta?.pages || 1);
                setPage(res.meta?.page || 1);
            } else {
                toast.error(res.error || "Failed to fetch invoices");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await getSuppliers();
            setSuppliers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch suppliers");
        }
    };

    const fetchParts = async () => {
        try {
            const res = await getParts({ includeInactive: true });
            setParts(Array.isArray(res.parts) ? res.parts : []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch parts");
        }
    };

    useEffect(() => {
        fetchInvoices(page);
    }, [page]);

    useEffect(() => {
        setPage(1);
        fetchInvoices(1);
    }, [searchTerm, filterSupplier, filterStatus]);

    // Form handlers
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

    const handleCreateInvoice = async () => {
        if (!formData.supplier) return toast.error("Please select a supplier");
        if (!formData.items.length || formData.items.some((i) => !i.part))
            return toast.error("Please select at least one part");
        if (!formData.vendorInvoiceNumber)
            return toast.error("Please provide a vendor invoice number");

        try {
            await PurchasePartsApi.createInvoice(formData);
            toast.success("Invoice created successfully");
            setIsAddDialogOpen(false);
            setFormData({
                supplier: "",
                items: [{ part: "", rate: 0, quantity: 1 }],
                paymentDate: new Date().toISOString().slice(0, 10),
                discount: 0,
                vatIncluded: true,
                vendorInvoiceNumber: "",
            });
            fetchInvoices(page);
        } catch (err) {
            console.error(err.response || err);
            toast.error(err.response?.data?.error || "Failed to create invoice");
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Parts Purchase Invoices</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">
                            <Plus className="h-4 w-4" /> Create Invoice
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl rounded-lg shadow-lg p-6 bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">Create New Invoice</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                            {/* Supplier */}
                            <div className="space-y-1">
                                <Label>Supplier</Label>
                                <select
                                    value={formData.supplier}
                                    onChange={handleInputChange}
                                    name="supplier"
                                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Items */}
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-4 gap-4 items-end">
                                    <div>
                                        <Label>Part</Label>
                                        <select
                                            value={item.part}
                                            onChange={(e) => handleItemChange(idx, "part", e.target.value)}
                                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        >
                                            <option value="">Select Part</option>
                                            {parts.map((p) => (
                                                <option key={p._id} value={p._id}>{p.partName} ({p.partNumber})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Rate (£)</Label>
                                        <Input type="number" min={0} value={item.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} className="w-full" />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input type="number" min={1} value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} className="w-full" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => removeItem(idx)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Remove</Button>
                                    </div>
                                </div>
                            ))}
                            <Button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2">Add Another Part</Button>

                            {/* Invoice Info */}
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <Label>Vendor Invoice Number</Label>
                                    <Input name="vendorInvoiceNumber" value={formData.vendorInvoiceNumber} onChange={handleInputChange} className="w-full" />
                                </div>
                                <div>
                                    <Label>Payment Date</Label>
                                    <Input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleInputChange} className="w-full" />
                                </div>

                                <div className="flex items-center gap-2 mt-6">
                                    <input type="checkbox" id="vatIncluded" name="vatIncluded" checked={formData.vatIncluded} onChange={handleInputChange} className="accent-blue-600" />
                                    <Label htmlFor="vatIncluded">VAT Included</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <Button onClick={() => setIsAddDialogOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Cancel</Button>
                                <Button onClick={handleCreateInvoice} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create Invoice</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <Label>Search Part Name</Label>
                    <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Part name..." className="w-full" />
                </div>
                <div className="flex-1">
                    <Label>Filter Supplier</Label>
                    <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-full border rounded px-3 py-2">
                        <option value="">All Suppliers</option>
                        {suppliers.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <Label>Status</Label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
                <Button onClick={() => fetchInvoices(1)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">Apply Filters</Button>
            </div>

            {/* Invoice Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-4 py-2 border">Parts</th>
                            <th className="px-4 py-2 border">Total Price</th>
                            <th className="px-4 py-2 border">Supplier</th>
                            <th className="px-4 py-2 border">Status</th>
                            <th className="px-4 py-2 border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">Loading...</td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">No invoices found</td>
                            </tr>
                        ) : (
                            invoices.map((inv, idx) => {
                                const items = Array.isArray(inv.items) ? inv.items : [];
                                const subtotal = items.reduce((sum, item) => sum + ((item.rate || 0) * (item.quantity || 0)), 0);
                                const discount = Number(inv.discount || 0);
                                const vat = inv.vatIncluded ? (subtotal - discount) * 0.2 : 0;
                                const total = subtotal - discount + vat;

                                return (
                                    <tr key={inv._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 text-center`}>
                                        <td className="border px-4 py-2 text-left">
                                            {items.map((item, i) => (
                                                <div key={i}>
                                                    {item.part?.partName || "Unknown"} x{item.quantity || 1} (£{(item.rate || 0).toFixed(2)})
                                                </div>
                                            ))}
                                        </td>
                                        <td className="border px-4 py-2 font-semibold">£{total.toFixed(2)}</td>
                                        <td className="border px-4 py-2">{inv.supplier?.name || "Unknown"}</td>
                                        <td className="border px-4 py-2">{inv.paymentStatus || "Pending"}</td>
                                        <td className="border px-4 py-2 flex justify-center gap-2">
                                            <Button
                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                                onClick={() => {
                                                    setSelectedInvoiceId(inv._id);
                                                    setIsInvoiceModalOpen(true);
                                                }}
                                            >
                                                <Eye className="w-4 h-4 inline" /> View/Edit
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
                onPageChange={handlePageChange}
            />

            {/* Invoice Modal */}
            {isInvoiceModalOpen && selectedInvoiceId && (
                <PartsInvoiceModal
                    invoiceId={selectedInvoiceId}
                    isOpen={isInvoiceModalOpen}
                    onClose={() => {
                        setIsInvoiceModalOpen(false);
                        fetchInvoices(page);
                    }}
                />
            )}
        </div>
    );
}
