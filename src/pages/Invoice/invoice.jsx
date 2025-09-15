// src/pages/Invoices.jsx
import React, { useEffect, useState } from "react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { toast } from "react-toastify";

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");

    // Fetch all invoices
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await InvoiceApi.getAllInvoices();
            setInvoices(data);
            setFilteredInvoices(data);
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

    // Filter logic
    useEffect(() => {
        let filtered = invoices;

        // Text search filter
        if (searchFilter) {
            const lowerValue = searchFilter.toLowerCase();
            filtered = filtered.filter(
                (inv) =>
                    inv.invoiceNo?.toLowerCase().includes(lowerValue) ||
                    inv.customerName?.toLowerCase().includes(lowerValue) ||
                    inv.vehicleRegNo?.toLowerCase().includes(lowerValue)
            );
        }

        // Month filter
        if (monthFilter) {
            filtered = filtered.filter((inv) => {
                const month = new Date(inv.createdAt).getMonth() + 1; // 1-12
                return month === parseInt(monthFilter, 10);
            });
        }

        // Year filter
        if (yearFilter) {
            filtered = filtered.filter((inv) => {
                const year = new Date(inv.createdAt).getFullYear();
                return year === parseInt(yearFilter, 10);
            });
        }

        setFilteredInvoices(filtered);
    }, [searchFilter, monthFilter, yearFilter, invoices]);

    // Download PDF
    const handleDownloadPdf = async (invoiceId, invoiceNo) => {
        try {
            await InvoiceApi.downloadInvoicePdf(invoiceId, `${invoiceNo}.pdf`);
            toast.success("Invoice downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download invoice");
        }
    };

    // Get unique years from invoices
    const years = Array.from(
        new Set(invoices.map((inv) => new Date(inv.createdAt).getFullYear()))
    ).sort((a, b) => b - a);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h1 className="text-2xl font-bold mb-2 md:mb-0">Invoices</h1>
                <div className="flex flex-col md:flex-row gap-2">
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search by Invoice No, Customer Name, or Vehicle Reg No"
                        className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                    />
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                    >
                        <option value="">All Months</option>
                        {[
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                        ].map((m, i) => (
                            <option key={i} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                    >
                        <option value="">All Years</option>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <p>Loading invoices...</p>
            ) : filteredInvoices.length === 0 ? (
                <p className="text-gray-500">No invoices found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-2 px-4 text-left">Invoice No</th>
                                <th className="py-2 px-4 text-left">Customer Name</th>
                                <th className="py-2 px-4 text-left">Contact No</th>
                                <th className="py-2 px-4 text-left">Vehicle Reg No</th>
                                <th className="py-2 px-4 text-left">Post code</th>
                                <th className="py-2 px-4 text-left">Amount</th>
                                <th className="py-2 px-4 text-left">Status</th> {/* NEW */}
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice._id} className="border-b hover:bg-gray-100">
                                    <td className="py-2 px-4">{invoice.invoiceNo}</td>
                                    <td className="py-2 px-4">{invoice.customerName}</td>
                                    <td className="py-2 px-4">{invoice.contactNo}</td>
                                    <td className="py-2 px-4">{invoice.vehicleRegNo}</td>
                                    <td className="py-2 px-4">{invoice.postalCode}</td>
                                    <td className="py-2 px-4">£{invoice.totalAmount?.toFixed(2) || "0.00"}</td>
                                    <td className="py-2 px-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-white ${invoice.status === "Paid"
                                                    ? "bg-green-600"
                                                    : invoice.status === "Unpaid"
                                                        ? "bg-red-600"
                                                        : "bg-gray-500"
                                                }`}
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                            onClick={() =>
                                                handleDownloadPdf(invoice._id, invoice.invoiceNo)
                                            }
                                        >
                                            View PDF
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
