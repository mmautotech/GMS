// src/components/InvoiceView.jsx
import React from "react";

// GBP formatter
const numberFmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
});

export default function InvoiceView({ invoice }) {
    if (!invoice)
        return <p className="text-center text-gray-500">No invoice data available.</p>;

    const formatCurrency = (amount) =>
        amount != null ? numberFmt.format(Number(amount)) : "";

    // Generate rows with minimum rows (for equal table height)
    const generateRows = () => {
        const rows = [];
        const MIN_ROWS = 5;
        const invoiceItems = invoice.items || [];

        // Add actual invoice items
        invoiceItems.forEach((item) => {
            rows.push({
                description: item.description || "",
                quantity: item.quantity || 1,
                amount: item.amount,
            });
        });

        // Add blank rows if fewer than MIN_ROWS
        for (let i = invoiceItems.length; i < MIN_ROWS; i++) {
            rows.push({ description: "", quantity: "", amount: null });
        }

        return rows;
    };

    const rows = generateRows();

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 text-sm text-black border border-black">
            {/* Header */}
            <div className="mb-4 text-center border-b pb-2">
                <h2 className="text-xl font-bold">PERIVALE MOTOR SERVICES LTD</h2>
                <p>Garage Address Line 1, City, Postcode</p>
                <p>Phone: 01234 567890</p>
            </div>

            {/* Invoice Title */}
            <h1 className="text-center font-bold text-lg mb-2">CUSTOMER INVOICE</h1>

            {/* Customer & Vehicle Info */}
            <table className="w-full border border-black mb-4 text-sm">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 font-semibold w-1/4">INVOICE #</td>
                        <td className="border border-black p-1 w-1/4">{invoice.invoiceNo || "—"}</td>
                        <td className="border border-black p-1 font-semibold w-1/4">Invoice Date</td>
                        <td className="border border-black p-1 w-1/4">
                            {invoice.invoiceDate
                                ? new Date(invoice.invoiceDate).toLocaleDateString("en-GB")
                                : "—"}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-semibold">Customer Name</td>
                        <td className="border border-black p-1">{invoice.customerName || "—"}</td>
                        <td className="border border-black p-1 font-semibold">Make & Model</td>
                        <td className="border border-black p-1">{invoice.makeModel || "—"}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-semibold">Contact #</td>
                        <td className="border border-black p-1">{invoice.contactNo || "—"}</td>
                        <td className="border border-black p-1 font-semibold">Vehicle Reg</td>
                        <td className="border border-black p-1">{invoice.vehicleRegNo || "—"}</td>
                    </tr>
                </tbody>
            </table>

            {/* Items */}
            <table className="w-full border border-black mb-4 text-sm table-fixed">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border border-black p-1 text-left">Description</th>
                        <th className="border border-black p-1 text-center">Qty</th>
                        <th className="border border-black p-1 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((item, i) => (
                        <tr key={i} className="h-10"> {/* fixed height for all rows */}
                            <td className="border border-black p-1">{item.description}</td>
                            <td className="border border-black p-1 text-center">{item.quantity}</td>
                            <td className="border border-black p-1 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <table className="w-full border border-black mb-4 text-sm">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 font-semibold text-right" colSpan={2}>Total</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(invoice.totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Footer Notes */}
            <div className="text-xs space-y-1">
                <p>We are responsible for job done (above-mentioned) only. Please contact our customer service number in case of any issue relevant to job done.</p>
                <p>Parts replaced can be taken at the time of car collection; later we dispose them. Please check your belongings before leaving the garage.</p>
                <p>SOP: 50% advance is required before starting the job.</p>
                <p><strong>Bank Details:</strong> Perivale Motor Services1 LTD, Sort Code: 30-54-66, Account No: 32006468</p>
                <p className="pt-2">For __ PERIVALE MOTORS</p>
            </div>
        </div>
    );
}
