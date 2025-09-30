// src/pages/PartsPurchase/PartsInvoiceRow.jsx
import React from "react";
import { Eye } from "lucide-react";
import { Button } from "../../ui/button";

const fmtGBP = (val) =>
    val != null
        ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
        : "—";

export default function PartsInvoiceRow({ invoice, onViewEdit }) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    // Prefer backend virtual totalAmount, fallback manual calculation
    const fallbackTotal = items.reduce(
        (sum, item) => sum + (item.rate || 0) * (item.quantity || 0),
        0
    );
    const total = invoice.totalAmount ?? fallbackTotal;

    return (
        <tr className="odd:bg-white even:bg-gray-50 hover:bg-blue-50">
            <td className="p-2 border">{invoice.rowNumber || "—"}</td>
            <td className="p-2 border">{invoice.booking?.vehicleRegNo || "—"}</td>
            <td className="p-2 border">{invoice.purchaser?.username || "—"}</td>
            <td className="p-2 border">{invoice.supplier?.name || "—"}</td>
            <td className="p-2 border">
                {items.length > 0 ? (
                    items.map((item, i) => (
                        <div key={i}>
                            {item.part?.partName || "—"} x{item.quantity || 1} (
                            {fmtGBP(item.rate)})
                        </div>
                    ))
                ) : (
                    "—"
                )}
            </td>
            <td className="p-2 border">{invoice.vatIncluded ? "Yes" : "No"}</td>
            <td className="p-2 border">{invoice.vendorInvoiceNumber || "—"}</td>
            <td className="p-2 border">
                {invoice.createdAt
                    ? new Date(invoice.createdAt).toLocaleDateString()
                    : "—"}
            </td>
            <td className="p-2 border">
                {invoice.paymentDate
                    ? new Date(invoice.paymentDate).toLocaleDateString()
                    : "—"}
            </td>
            <td className="p-2 border">{invoice.paymentStatus || "—"}</td>
            <td className="p-2 border font-semibold text-right">{fmtGBP(total)}</td>
            <td className="p-2 border text-center">
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                    onClick={() => onViewEdit(invoice._id)}
                >
                    <Eye className="w-4 h-4 inline mr-1" /> View/Edit
                </Button>
            </td>
        </tr>
    );
}
