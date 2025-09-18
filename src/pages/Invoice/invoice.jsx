import React, { useEffect, useState, useMemo } from "react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { toast } from "react-toastify";
import StatCard from "../Dashboard/StatCard.jsx";

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(20); // items per page
    const [totalPages, setTotalPages] = useState(1);

    const fetchInvoices = async (page = 1) => {
        try {
            setLoading(true);
            const res = await InvoiceApi.getAllInvoices({
                page,
                limit,
                search: searchFilter,
            });

            // Backend response { data, pagination: { total, page, totalPages } }
            const { data, pagination } = res;
            setInvoices(data);
            setTotalPages(pagination?.totalPages || 1);
            setPage(page);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(1);
    }, [searchFilter, monthFilter, yearFilter]);

    const handleDownloadPdf = async (invoiceId, invoiceNo) => {
        try {
            await InvoiceApi.downloadInvoicePdf(invoiceId, `${invoiceNo}.pdf`);
            toast.success("Invoice downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download invoice");
        }
    };

    const years = Array.from(
        new Set(invoices.map((inv) => new Date(inv.createdAt).getFullYear()))
    ).sort((a, b) => b - a);

    const invoiceStats = useMemo(() => {
        const total = invoices.length;
        const paid = invoices.filter((inv) => inv.status === "Paid").length;
        const unpaid = invoices.filter((inv) => inv.status === "Unpaid").length;
        return { total, paid, unpaid };
    }, [invoices]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        fetchInvoices(newPage);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Invoices</h1>

            {/* Invoice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Total Invoices" value={invoiceStats.total} />
                <StatCard title="Paid" value={invoiceStats.paid} />
                <StatCard title="Unpaid" value={invoiceStats.unpaid} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
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
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ].map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                >
                    <option value="">All Years</option>
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p>Loading invoices...</p>
            ) : invoices.length === 0 ? (
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
                                <th className="py-2 px-4 text-left">Status</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
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
                                            onClick={() => handleDownloadPdf(invoice._id, invoice.invoiceNo)}
                                        >
                                            View PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-2 mt-4">
                        <button
                            className="px-3 py-1 border rounded"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            Prev
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            className="px-3 py-1 border rounded"
                            disabled={page === totalPages || invoices.length < limit} // disable Next if no more data
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
