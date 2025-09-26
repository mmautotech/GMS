// src/pages/InternalInvoice/InternalInvoicePage.jsx
import React, { useEffect, useState } from "react";
import {
    getAllInternalInvoices,
    deleteInternalInvoice,
} from "../../lib/api/internalInvoiceApi.js";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export default function InternalInvoicePage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const VAT_RATE = 0.2; // 20% VAT

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await getAllInternalInvoices({ page, search, fromDate, toDate });
            setInvoices(Array.isArray(res.data.data) ? res.data.data : []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching internal invoices:", error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteInternalInvoice(id);
            toast.success("Invoice deleted");
            fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("Failed to delete invoice");
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, search, fromDate, toDate]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Internal Invoices</h1>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search by vehicle or description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <Button onClick={() => setPage(1)}>Apply</Button>
            </div>

            {loading ? (
                <p>Loading invoices...</p>
            ) : invoices.length === 0 ? (
                <p>No internal invoices found.</p>
            ) : (
                <div className="overflow-x-auto border rounded-lg shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Invoice No</th>
                                <th className="p-2 text-left">Vehicle</th>
                                <th className="p-2 text-left">Revenue</th>
                                <th className="p-2 text-left">Cost</th>
                                <th className="p-2 text-left">Profit</th>
                                <th className="p-2 text-left">VAT</th>
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <React.Fragment key={inv._id}>
                                    <tr
                                        className={`border-t hover:bg-gray-50 ${inv.vatIncluded ? "bg-yellow-50" : ""}`}
                                    >
                                        <td className="p-2">{inv.customerInvoice?.invoiceNo}</td>
                                        <td className="p-2">{inv.vehicleRegNo}</td>
                                        <td className="p-2 font-semibold">
                                            £{inv.vatIncluded
                                                ? (inv.totalRevenue + (inv.vatTotal || 0)).toFixed(2)
                                                : inv.totalRevenue.toFixed(2)}
                                        </td>
                                        <td className="p-2 text-red-600">£{inv.totalCost}</td>
                                        <td className="p-2 font-bold text-green-600">£{inv.profit}</td>
                                        <td className="p-2">{inv.vatIncluded ? "Yes" : "No"}</td>
                                        <td className="p-2">{new Date(inv.invoiceDate).toLocaleDateString("en-GB")}</td>
                                        <td className="p-2 flex gap-2 justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setExpanded(expanded === inv._id ? null : inv._id)
                                                }
                                            >
                                                {expanded === inv._id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(inv._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>

                                    {expanded === inv._id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="8" className="p-3">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs border">
                                                        <thead className="bg-gray-200">
                                                            <tr>
                                                                <th className="p-2 text-left">Description</th>
                                                                <th className="p-2 text-left">Type</th>
                                                                <th className="p-2 text-left">Qty</th>
                                                                <th className="p-2 text-left">Cost</th>
                                                                <th className="p-2 text-left">Selling</th>
                                                                <th className="p-2 text-left">VAT</th>
                                                                <th className="p-2 text-left">Total</th>
                                                                <th className="p-2 text-left">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {inv.items.map((item, idx) => {
                                                                const vatAmount = item.vatIncluded
                                                                    ? (item.sellingPrice || 0) * VAT_RATE
                                                                    : 0;
                                                                const totalPrice =
                                                                    (item.sellingPrice || 0) + vatAmount;
                                                                return (
                                                                    <tr key={idx} className="border-t">
                                                                        <td className="p-2">{item.description}</td>
                                                                        <td className="p-2">{item.invoiceType}</td>
                                                                        <td className="p-2">{item.quantity}</td>
                                                                        <td className="p-2 text-red-600">£{item.costPrice}</td>
                                                                        <td className="p-2">£{item.sellingPrice}</td>
                                                                        <td className="p-2">£{vatAmount.toFixed(2)}</td>
                                                                        <td className="p-2 font-semibold">£{totalPrice.toFixed(2)}</td>
                                                                        <td className="p-2">{item.paymentStatus}</td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Summary Row */}
                                                            <tr className="bg-gray-100 font-bold">
                                                                <td colSpan="5" className="p-2 text-right">
                                                                    Total VAT:
                                                                </td>
                                                                <td className="p-2">
                                                                    £{inv.items
                                                                        .reduce(
                                                                            (sum, item) =>
                                                                                sum + (item.vatIncluded
                                                                                    ? (item.sellingPrice || 0) * VAT_RATE
                                                                                    : 0),
                                                                            0
                                                                        )
                                                                        .toFixed(2)}
                                                                </td>
                                                                <td colSpan="2"></td>
                                                            </tr>
                                                            <tr className="bg-gray-100 font-bold">
                                                                <td colSpan="5" className="p-2 text-right">
                                                                    Total Amount:
                                                                </td>
                                                                <td className="p-2">
                                                                    £{inv.items
                                                                        .reduce(
                                                                            (sum, item) =>
                                                                                sum +
                                                                                (item.sellingPrice || 0) +
                                                                                (item.vatIncluded
                                                                                    ? (item.sellingPrice || 0) * VAT_RATE
                                                                                    : 0),
                                                                            0
                                                                        )
                                                                        .toFixed(2)}
                                                                </td>
                                                                <td colSpan="2"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-end gap-2 p-2">
                        <Button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}