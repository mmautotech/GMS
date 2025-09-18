// src/pages/PartsPurchase/partsPurchase.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PurchasePartsApi from "../../lib/api/purchasepartsApi.js";

export default function PartsPurchase() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    // Fetch all invoices (user-specific)
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await PurchasePartsApi.getMyInvoices({ status: "Pending" });
            setInvoices(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Download PDF handler
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

    // Flatten invoices to per-item rows
    const rows = [];
    invoices.forEach((inv) => {
        inv.items.forEach((item) => {
            rows.push({
                invoiceId: inv._id,
                partName: item.part?.partName || "Unknown",
                price: item.rate != null ? `£${Number(item.rate).toFixed(2)}` : "-",
                supplier: inv.supplier?.name || "Unknown",
                status: inv.paymentStatus || "Pending",
            });
        });
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Parts Purchase Invoices</h1>
            {loading ? (
                <p>Loading invoices...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border">Part Name</th>
                                <th className="px-4 py-2 border">Price</th>
                                <th className="px-4 py-2 border">Supplier</th>
                                <th className="px-4 py-2 border">Status</th>
                                <th className="px-4 py-2 border">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4">
                                        No invoices found
                                    </td>
                                </tr>
                            )}
                            {rows.map((row, idx) => (
                                <tr key={idx} className="text-center">
                                    <td className="border px-4 py-2">{row.partName}</td>
                                    <td className="border px-4 py-2">{row.price}</td>
                                    <td className="border px-4 py-2">{row.supplier}</td>
                                    <td className="border px-4 py-2">{row.status}</td>
                                    <td className="border px-4 py-2">
                                        <button
                                            className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ${downloadingId === row.invoiceId ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                            onClick={() => handleDownloadPdf(row.invoiceId)}
                                            disabled={downloadingId === row.invoiceId}
                                        >
                                            {downloadingId === row.invoiceId ? "Downloading..." : "Download PDF"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
