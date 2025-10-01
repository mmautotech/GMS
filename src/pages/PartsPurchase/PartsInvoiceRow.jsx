// src/pages/PartsPurchase/PartsInvoiceRow.jsx
import React from "react";
import { Eye } from "lucide-react";
import { Button } from "../../ui/button";

const fmtGBP = (val) =>
    val != null
        ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
        : "—";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

export default function PartsInvoiceRow({ invoice, onViewEdit }) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    // Some APIs return an ObjectId, some return a user object, some add helper fields.
    const purchaserDisplay =
        invoice?.purchaser?.username ??
        invoice?.purchaser?.name ??
        invoice?.purchaserUsername ??
        invoice?.purchaserName ??
        (typeof invoice?.purchaser === "string" ? invoice.purchaser : "—");

    // Prefer backend virtual totalAmount, fallback manual calc
    const fallbackTotal = items.reduce(
        (sum, item) => sum + (item.rate || 0) * (item.quantity || 0),
        0
    );
    const total = invoice.totalAmount ?? fallbackTotal;

    // If your backend later adds invoiceDate, show that; otherwise createdAt.
    const invoiceDate = invoice.invoiceDate || invoice.createdAt;

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
