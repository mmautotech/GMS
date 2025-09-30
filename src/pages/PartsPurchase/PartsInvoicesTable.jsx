// src/pages/PartsPurchase/PartsInvoicesTable.jsx
import React, { useMemo } from "react";
import PartsInvoiceRow from "./PartsInvoiceRow.jsx";

export default function PartsInvoicesTable({ invoices, loading, onViewEdit }) {
    const rows = useMemo(() => invoices || [], [invoices]);

    return (
        <div className="bg-white rounded shadow p-4 mt-4">
            <h2 className="text-xl font-semibold mb-4">Invoices</h2>
            <div className="overflow-auto">
                <table className="w-full table-auto text-xs whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-200 text-left">
                            <th className="p-2 border text-[13px]">#</th>
                            <th className="p-2 border text-[13px]">Vehicle Reg</th>
                            <th className="p-2 border text-[13px]">Purchaser</th>
                            <th className="p-2 border text-[13px]">Supplier</th>
                            <th className="p-2 border text-[13px]">Parts</th>
                            <th className="p-2 border text-[13px]">VAT</th>
                            <th className="p-2 border text-[13px]">Vendor Invoice #</th>
                            <th className="p-2 border text-[13px]">Invoice Date</th>
                            <th className="p-2 border text-[13px]">Payment Date</th>
                            <th className="p-2 border text-[13px]">Payment Status</th>
                            <th className="p-2 border text-[13px]">Total</th>
                            <th className="p-2 border text-[13px] text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={12} className="p-4 text-center text-gray-500">
                                    Loading invoices...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="p-4 text-center text-gray-500">
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            rows.map((inv) => (
                                <PartsInvoiceRow
                                    key={inv._id}
                                    invoice={inv}
                                    onViewEdit={onViewEdit}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
