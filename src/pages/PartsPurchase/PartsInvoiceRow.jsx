// src/pages/PartsPurchase/PartsInvoiceRow.jsx
import React from "react";
import { Eye, FileText } from "lucide-react";
import { Button } from "../../ui/button";
import PurchaseInvoiceApi from "../../lib/api/purchaseInvoiceApi.js";

const fmtGBP = (val) =>
    val != null
        ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
        : "—";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

export default function PartsInvoiceRow({ invoice, onViewEdit }) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    const purchaserDisplay =
        invoice?.purchaser?.username ??
        invoice?.purchaser?.name ??
        invoice?.purchaserUsername ??
        invoice?.purchaserName ??
        (typeof invoice?.purchaser === "string" ? invoice.purchaser : "—");

    const fallbackTotal = items.reduce(
        (sum, item) => sum + (item.rate || 0) * (item.quantity || 0),
        0
    );
    const total = invoice.totalAmount ?? fallbackTotal;
    const invoiceDate = invoice.invoiceDate || invoice.createdAt;

    // 🟢 Handler for export
    const handleExportPDF = () => {
        PurchaseInvoiceApi.exportInvoicePdf(invoice._id);
    };

    return (
        <tr className="odd:bg-white even:bg-gray-50 hover:bg-blue-50">
            <td className="p-2 border">{invoice.rowNumber || "—"}</td>
            <td className="p-2 border">
                {invoice.booking?.vehicleRegNo || invoice.vehicleRegNo || "—"}
            </td>
            <td className="p-2 border">{purchaserDisplay}</td>
            <td className="p-2 border">
                {invoice.supplier?.name ?? invoice.supplierName ?? "—"}
            </td>
            <td className="p-2 border">
                {items.length > 0
                    ? items.map((item, i) => {
                        const name =
                            item.part?.partName ??
                            item.partName ??
                            (typeof item.part === "string" ? item.part : "—");
                        return (
                            <div key={i}>
                                {name} x{item.quantity || 1} ({fmtGBP(item.rate)})
                            </div>
                        );
                    })
                    : "—"}
            </td>
            <td className="p-2 border">{invoice.vatIncluded ? "Yes" : "No"}</td>
            <td className="p-2 border">{invoice.vendorInvoiceNumber || "—"}</td>
            <td className="p-2 border">{fmtDate(invoiceDate)}</td>
            <td className="p-2 border">{fmtDate(invoice.paymentDate)}</td>
            <td className="p-2 border">{invoice.paymentStatus || "—"}</td>
            <td className="p-2 border font-semibold text-right">{fmtGBP(total)}</td>
            <td className="p-2 border text-center flex gap-2 justify-center">
                {/* View/Edit */}
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                    onClick={() => onViewEdit(invoice._id)}
                >
                    <Eye className="w-4 h-4 inline mr-1" /> View/Edit
                </Button>

                {/* Export PDF */}
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs"
                    onClick={handleExportPDF}
                >
                    <FileText className="w-4 h-4 inline mr-1" /> Export
                </Button>
            </td>
        </tr>
    );
}
