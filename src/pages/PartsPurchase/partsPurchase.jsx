// src/pages/PartsPurchase/partsPurchase.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js";
import { getParts } from "../../lib/api/partsApi.js";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Plus } from "lucide-react";
import Pagination from "../../components/Pagination.jsx";

export default function PartsPurchase() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);

    // Modal states
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

    // Fetch invoices with pagination
    const fetchInvoices = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const res = await PurchasePartsApi.getMyInvoices({
                page: pageNumber,
                limit: pageSize,
            });
            if (res.success) {
                setInvoices(res.data);
                setTotalPages(res.meta.pages);
                setPage(res.meta.page);
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

    // Fetch suppliers & parts
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
            setParts(res.parts || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch parts");
        }
    };

    useEffect(() => {
        fetchInvoices(page);
        fetchSuppliers();
        fetchParts();
    }, [page]);

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
        newItems[index][field] = field === "rate" || field === "quantity" ? Number(value) : value;
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData((prev) => ({ ...prev, items: [...prev.items, { part: "", rate: 0, quantity: 1 }] }));
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const handleCreateInvoice = async () => {
        if (!formData.supplier) return toast.error("Please select a supplier");
        if (!formData.items.length || formData.items.some((i) => !i.part)) return toast.error("Please select at least one part");
        if (!formData.vendorInvoiceNumber) return toast.error("Please provide a vendor invoice number");

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

    const handleDownloadPdf = async (invoiceId) => {
        try {
            setDownloadingId(invoiceId);
            await PurchasePartsApi.downloadAndSaveInvoice(invoiceId);
            toast.success("Invoice downloaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download invoice PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Parts Purchase Invoices</h1>

            {/* Add Invoice Modal */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white mb-4">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Supplier */}
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <select
                                id="supplier"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleInputChange}
                                className="w-full border rounded px-2 py-1"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Items */}
                        {formData.items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                                <div className="space-y-1">
                                    <Label>Part</Label>
                                    <select
                                        value={item.part}
                                        onChange={(e) => handleItemChange(idx, "part", e.target.value)}
                                        className="w-full border rounded px-2 py-1"
                                    >
                                        <option value="">Select Part</option>
                                        {parts.map((p) => (
                                            <option key={p._id} value={p._id}>{p.partName} ({p.partNumber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Rate (£)</Label>
                                    <Input type="number" min={0} value={item.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Quantity</Label>
                                    <Input type="number" min={1} value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => removeItem(idx)} className="bg-red-600 hover:bg-red-700 text-white">Remove</Button>
                                </div>
                            </div>
                        ))}

                        <Button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white mt-2">Add Another Part</Button>

                        {/* Invoice Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="vendorInvoiceNumber">Vendor Invoice Number</Label>
                                <Input id="vendorInvoiceNumber" name="vendorInvoiceNumber" value={formData.vendorInvoiceNumber} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="paymentDate">Payment Date</Label>
                                <Input id="paymentDate" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="discount">Discount (£)</Label>
                                <Input id="discount" name="discount" type="number" value={formData.discount} onChange={handleInputChange} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="vatIncluded" name="vatIncluded" checked={formData.vatIncluded} onChange={handleInputChange} />
                                <Label htmlFor="vatIncluded">VAT Included</Label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateInvoice}>Create Invoice</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border">Parts</th>
                            <th className="px-4 py-2 border">Total Price</th>
                            <th className="px-4 py-2 border">Supplier</th>
                            <th className="px-4 py-2 border">Status</th>
                            <th className="px-4 py-2 border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-4">No invoices found</td>
                            </tr>
                        )}
                        {invoices.map((inv) => (
                            <tr key={inv._id} className="text-center">
                                <td className="border px-4 py-2 text-left">
                                    {inv.items.map((item, i) => (
                                        <div key={i}>
                                            {item.part?.partName || "Unknown"} x{item.quantity} (£{item.rate?.toFixed(2)})
                                        </div>
                                    ))}
                                </td>
                                <td className="border px-4 py-2">
                                    £{inv.items.reduce((sum, item) => sum + (item.rate || 0) * (item.quantity || 1), 0).toFixed(2)}
                                </td>
                                <td className="border px-4 py-2">{inv.supplier?.name || "Unknown"}</td>
                                <td className="border px-4 py-2">{inv.paymentStatus || "Pending"}</td>
                                <td className="border px-4 py-2">
                                    <Button
                                        className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ${downloadingId === inv._id ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => handleDownloadPdf(inv._id)}
                                        disabled={downloadingId === inv._id}
                                    >
                                        {downloadingId === inv._id ? "Downloading..." : "Download PDF"}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
                onPageChange={setPage}
            />
        </div>
    );
}
