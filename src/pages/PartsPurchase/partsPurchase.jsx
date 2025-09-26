import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Plus, Eye } from "lucide-react";
import Pagination from "../../components/Pagination.jsx";
import PartsInvoiceModal from "./PartsInvoiceModal.jsx";

export default function PartsPurchase({ isAdmin = false }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(5);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSupplier, setFilterSupplier] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterVendorInvoice, setFilterVendorInvoice] = useState("");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");
    const [filterPurchaser, setFilterPurchaser] = useState("");

    const [suppliers, setSuppliers] = useState([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    // Fetch suppliers
    useEffect(() => {
        getSuppliers()
            .then(res => setSuppliers(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error("Failed to fetch suppliers"));
    }, []);

    // Fetch invoices
    const fetchInvoices = async (pageNumber = 1) => {
        try {
            setLoading(true);

            const params = {
                page: pageNumber,
                limit: pageSize,
                search: searchTerm || undefined,
                supplier: filterSupplier || undefined,
                purchaser: isAdmin ? filterPurchaser || undefined : undefined,
                paymentStatus: filterStatus || undefined,
                vendorInvoiceNumber: filterVendorInvoice || undefined,
                fromDate: filterFromDate || undefined,
                toDate: filterToDate || undefined,
            };

            const res = isAdmin
                ? await PurchasePartsApi.getAllInvoices(params)
                : await PurchasePartsApi.getMyInvoices(params);

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

    useEffect(() => {
        fetchInvoices(page);
    }, [page, isAdmin]);

    useEffect(() => {
        setPage(1);
        fetchInvoices(1);
    }, [searchTerm, filterSupplier, filterStatus, filterVendorInvoice, filterFromDate, filterToDate, filterPurchaser, isAdmin]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Parts Purchase Invoices</h1>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                    onClick={() => {
                        setSelectedInvoiceId(null);
                        setIsInvoiceModalOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 items-end flex-wrap">
                <div className="flex-1">
                    <Label>Search Vehicle / Part Name</Label> <br />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Vehicle Reg / Part..."
                        className="w-full"
                    />
                </div>

                <div className="flex-1">
                    <Label>Filter Supplier</Label><br />
                    <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <Label>Status</Label><br />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>

                <div className="flex-1">
                    <Label>Vendor Invoice #</Label><br />
                    <Input
                        value={filterVendorInvoice}
                        onChange={(e) => setFilterVendorInvoice(e.target.value)}
                        placeholder="Invoice number..."
                        className="w-full"
                    />
                </div>

                <div className="flex-1">
                    <Label>From Date</Label><br />
                    <Input
                        type="date"
                        value={filterFromDate}
                        onChange={(e) => setFilterFromDate(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div className="flex-1">
                    <Label>To Date</Label><br />
                    <Input
                        type="date"
                        value={filterToDate}
                        onChange={(e) => setFilterToDate(e.target.value)}
                        className="w-full"
                    />
                </div>

                {isAdmin && (
                    <div className="flex-1">
                        <Label>Purchaser</Label><br />
                        <Input
                            value={filterPurchaser}
                            onChange={(e) => setFilterPurchaser(e.target.value)}
                            placeholder="Purchaser username..."
                            className="w-full"
                        />
                    </div>
                )}

                <Button
                    onClick={() => fetchInvoices(1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                >
                    Apply Filters
                </Button>
            </div>

            {/* Invoice Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
                <table className="min-w-full table-auto text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-4 py-2 border">Vehicle Reg</th>
                            <th className="px-4 py-2 border">Purchaser</th>
                            <th className="px-4 py-2 border">Supplier</th>
                            <th className="px-4 py-2 border">Parts</th>
                            <th className="px-4 py-2 border">Discount</th>
                            <th className="px-4 py-2 border">VAT Included</th>
                            <th className="px-4 py-2 border">Vendor Invoice #</th>
                            <th className="px-4 py-2 border">Invoice Date</th>
                            <th className="px-4 py-2 border">Payment Date</th>
                            <th className="px-4 py-2 border">Payment Status</th>
                            <th className="px-4 py-2 border">Total Amount</th>
                            <th className="px-4 py-2 border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={12} className="text-center py-6 text-gray-500">Loading...</td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center py-6 text-gray-500">No invoices found</td>
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
                                        <td className="border px-4 py-2">{inv.vehicleRegNo}</td>
                                        <td className="border px-4 py-2">{inv.purchaser?.username || "Unknown"}</td>
                                        <td className="border px-4 py-2">{inv.supplier?.name || "Unknown"}</td>
                                        <td className="border px-4 py-2 text-left">
                                            {items.map((item, i) => (
                                                <div key={i}>{item.partName} x{item.quantity || 1} (£{(item.rate || 0).toFixed(2)})</div>
                                            ))}
                                        </td>
                                        <td className="border px-4 py-2">£{discount.toFixed(2)}</td>
                                        <td className="border px-4 py-2">{inv.vatIncluded ? "Yes" : "No"}</td>
                                        <td className="border px-4 py-2">{inv.vendorInvoiceNumber || "-"}</td>
                                        <td className="border px-4 py-2">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                        <td className="border px-4 py-2">{new Date(inv.paymentDate).toLocaleDateString()}</td>
                                        <td className="border px-4 py-2">{inv.paymentStatus}</td>
                                        <td className="border px-4 py-2 font-semibold">£{total.toFixed(2)}</td>
                                        <td className="border px-4 py-2 flex justify-center gap-2">
                                            <Button
                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                                onClick={() => { setSelectedInvoiceId(inv._id); setIsInvoiceModalOpen(true); }}
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
            {isInvoiceModalOpen && (
                <PartsInvoiceModal
                    invoiceId={selectedInvoiceId}
                    isOpen={isInvoiceModalOpen}
                    onClose={() => { setIsInvoiceModalOpen(false); fetchInvoices(page); }}
                />
            )}
        </div>
    );
}