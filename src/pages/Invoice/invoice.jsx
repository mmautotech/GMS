// src/pages/Invoice/invoice.jsx
import React, { useEffect, useState } from "react";
import { InvoiceApi } from "../../lib/api/invoiceApi.js";
import { createInternalInvoice } from "../../lib/api/internalinvoiceApi.js";
import { toast } from "react-toastify";
import StatCard from "../../components/StatCard.jsx";
import { Eye, FileText, FilePlus } from "lucide-react";

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingInternalInvoice, setCreatingInternalInvoice] = useState(false);

    // Filters
    const [searchFilter, setSearchFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Stats
    const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0, partial: 0 });

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await InvoiceApi.getInvoiceStats();
            setStats(res);
        } catch (err) {
            console.error("Error fetching stats:", err);
            toast.error("Failed to fetch invoice stats");
        }
    };

    // Fetch invoices
    const fetchInvoices = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const res = await InvoiceApi.getAllInvoices({
                page: pageNumber,
                limit,
                search: searchFilter || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                status: statusFilter || undefined,
            });

            const { data, pagination } = res;
            setInvoices(data || []);
            setTotalPages(pagination?.totalPages || 1);
            setTotalCount(pagination?.total || 0);
            setPage(pageNumber);

            if (!data || data.length === 0) {
                toast.info("No invoices found for the selected filters.");
            }
        } catch (err) {
            console.error("Error fetching invoices:", err);
            toast.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchInvoices(1);
    }, []);

    useEffect(() => {
        fetchInvoices(1);
    }, [searchFilter, fromDate, toDate, limit, statusFilter]);

    // View PDF
    const handleViewPdf = (invoiceId, isProforma = false) => {
        InvoiceApi.viewInvoicePdf(invoiceId, isProforma);
    };

    // Create Internal Invoice (using only invoiceId)
    const handleCreateInternalInvoice = async (invoiceId) => {
        if (!invoiceId) return;

        try {
            setCreatingInternalInvoice(true);
            console.log("Creating internal invoice with payload:", { invoiceId });
            const data = await createInternalInvoice({ invoiceId });
            console.log("Internal invoice created:", data);
            toast.success("Internal invoice created successfully!");
            fetchInvoices(page); // Refresh table
        } catch (err) {
            console.error("Error creating internal invoice:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || err.message || "Failed to create internal invoice");
        } finally {
            setCreatingInternalInvoice(false);
        }
    };


    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        fetchInvoices(newPage);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Invoices</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Invoices" value={stats.total} />
                <StatCard title="Paid" value={stats.paid} />
                <StatCard title="Unpaid" value={stats.unpaid} />
                <StatCard title="Partial" value={stats.partial} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search (Invoice No, Name, Contact, Reg No, Model...)"
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                />
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                />
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                >
                    <option value="">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                </select>
                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-4 py-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
                >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
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
                                <th className="py-2 px-4 text-left">S.NO</th>
                                <th className="py-2 px-4 text-left">Invoice No</th>
                                <th className="py-2 px-4 text-left">Date</th>
                                <th className="py-2 px-4 text-left">Customer</th>
                                <th className="py-2 px-4 text-left">Vehicle Reg</th>
                                <th className="py-2 px-4 text-left">Amount</th>
                                <th className="py-2 px-4 text-left">Status</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv, idx) => (
                                <tr key={inv._id} className="border-b hover:bg-gray-100">
                                    <td className="py-2 px-4">{(page - 1) * limit + idx + 1}</td>
                                    <td className="py-2 px-4">{inv.invoiceNo}</td>
                                    <td className="py-2 px-4">
                                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="py-2 px-4">{inv.customerName}</td>
                                    <td className="py-2 px-4">{inv.vehicleRegNo}</td>
                                    <td className="py-2 px-4">£{inv.totalAmount?.toFixed(2) || "0.00"}</td>
                                    <td className="py-2 px-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-white ${inv.status === "Paid"
                                                ? "bg-green-600"
                                                : inv.status === "Unpaid"
                                                    ? "bg-red-600"
                                                    : "bg-yellow-500"
                                                }`}
                                        >
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 flex gap-2">
                                        <button
                                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            onClick={() => handleViewPdf(inv._id)}
                                            title="View PDF"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                            onClick={() => handleViewPdf(inv._id, true)}
                                            title="Proforma"
                                        >
                                            <FileText size={18} />
                                        </button>
                                        <button
                                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleCreateInternalInvoice(inv._id)}
                                            title="Create Internal Invoice"
                                            disabled={creatingInternalInvoice}
                                        >
                                            <FilePlus size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-gray-600">Total Invoices: {totalCount}</span>
                        <div className="flex items-center gap-2">
                            <button
                                className={`px-3 py-1 rounded ${page === 1
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                disabled={page === 1}
                                onClick={() => handlePageChange(page - 1)}
                            >
                                Prev
                            </button>
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className={`px-3 py-1 rounded ${page === totalPages
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                disabled={page === totalPages}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
