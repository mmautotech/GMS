// src/pages/internalInvoices/InternalInvoicePage.jsx
import React, { useEffect, useState } from "react";
import { getAllInternalInvoices } from "../../lib/api/internalInvoiceApi.js";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const VAT_RATE = 0.2; // 20%

export default function InternalInvoicePage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await getAllInternalInvoices({ page, limit });
            setInvoices(Array.isArray(res.data) ? res.data : []);
            setTotalPages(res.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching internal invoices:", error);
            toast.error("Failed to load internal invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [page]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Internal Invoices</h1>

            {loading ? (
                <p>Loading internal invoices...</p>
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
                            {invoices.map((inv) => {
                                const revenue = Number(inv.revenue || 0);
                                const cost = Number(inv.cost || 0);
                                const profit = revenue - cost;

                                // VAT flag at invoice level
                                const hasVat = [
                                    ...(inv.items || []),
                                    ...(inv.booking?.services || []),
                                ].some((item) => item?.vatIncluded);

                                return (
                                    <React.Fragment key={inv._id}>
                                        <tr className="border-t hover:bg-gray-50">
                                            <td className="p-2">
                                                {inv.invoice?.invoiceNo || "N/A"}
                                            </td>
                                            <td className="p-2">
                                                {inv.booking?.vehicleRegNo || "-"}
                                            </td>
                                            <td className="p-2 font-semibold">
                                                £{revenue.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-red-600">
                                                £{cost.toFixed(2)}
                                            </td>
                                            <td className="p-2 font-bold text-green-600">
                                                £{profit.toFixed(2)}
                                            </td>
                                            <td className="p-2">{hasVat ? "Yes" : "No"}</td>
                                            <td className="p-2">
                                                {inv.createdAt
                                                    ? new Date(inv.createdAt).toLocaleDateString("en-GB")
                                                    : "-"}
                                            </td>
                                            <td className="p-2 flex justify-center">
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
                                            </td>
                                        </tr>

                                        {/* Expanded Items */}
                                        {expanded === inv._id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="8" className="p-3">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full text-xs border">
                                                            <thead className="bg-gray-200">
                                                                <tr>
                                                                    <th className="p-2 text-left">Description</th>
                                                                    <th className="p-2 text-left">Qty</th>
                                                                    <th className="p-2 text-left">Cost</th>
                                                                    <th className="p-2 text-left">Selling</th>
                                                                    <th className="p-2 text-left">VAT Paid</th>
                                                                    <th className="p-2 text-left">VAT Included</th>
                                                                    <th className="p-2 text-left">Total</th>
                                                                    <th className="p-2 text-left">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {[...(inv.items || []), ...(inv.booking?.services || [])]
                                                                    .filter(
                                                                        (item) =>
                                                                            item &&
                                                                            (item.description ||
                                                                                Number(item.cost) > 0 ||
                                                                                Number(item.selling) > 0)
                                                                    )
                                                                    .map((item, idx) => {
                                                                        const qty = Number(item.quantity || 1);
                                                                        const cost = Number(item.cost || 0);
                                                                        const selling = Number(item.selling || 0);
                                                                        const vatAmount = item.vatIncluded
                                                                            ? (selling || cost) * VAT_RATE
                                                                            : 0;
                                                                        const total = (selling || cost) + vatAmount;

                                                                        return (
                                                                            <tr key={idx} className="border-t">
                                                                                <td className="p-2">
                                                                                    {item.description || "N/A"}
                                                                                </td>
                                                                                <td className="p-2">{qty}</td>
                                                                                <td className="p-2 text-red-600">
                                                                                    £{cost.toFixed(2)}
                                                                                </td>
                                                                                <td className="p-2">
                                                                                    £{selling.toFixed(2)}
                                                                                </td>
                                                                                <td className="p-2 text-blue-600">
                                                                                    £{vatAmount.toFixed(2)}
                                                                                </td>
                                                                                <td className="p-2">
                                                                                    {item.vatIncluded ? "Yes" : "No"}
                                                                                </td>
                                                                                <td className="p-2 font-semibold">
                                                                                    £{total.toFixed(2)}
                                                                                </td>
                                                                                <td className="p-2">
                                                                                    {item.status || "N/A"}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}

                                                                {/* VAT Summary */}
                                                                <tr className="bg-gray-100 font-bold">
                                                                    <td colSpan="5" className="p-2 text-right">
                                                                        Total VAT Paid:
                                                                    </td>
                                                                    <td className="p-2 text-blue-700">
                                                                        £
                                                                        {[...(inv.items || []), ...(inv.booking?.services || [])]
                                                                            .filter(
                                                                                (item) =>
                                                                                    item &&
                                                                                    (item.description ||
                                                                                        Number(item.cost) > 0 ||
                                                                                        Number(item.selling) > 0)
                                                                            )
                                                                            .reduce((sum, item) => {
                                                                                const cost = Number(item.cost || 0);
                                                                                const selling = Number(item.selling || 0);
                                                                                const vatAmount = item.vatIncluded
                                                                                    ? (selling || cost) * VAT_RATE
                                                                                    : 0;
                                                                                return sum + vatAmount;
                                                                            }, 0)
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
                                );
                            })}
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
