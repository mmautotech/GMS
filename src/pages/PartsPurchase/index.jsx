// src/pages/PartsPurchase/PartsPurchase.jsx
import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

import { useSuppliers } from "../../hooks/useSuppliers.js";
import { useParts } from "../../hooks/useParts.js";
import { usePurchaseInvoices } from "../../hooks/usePurchaseInvoices.js";

import ParamsSummary from "../../components/ParamsSummary.jsx";
import PartsInvoiceModal from "./PartsInvoiceModal.jsx";
import PartsInvoicesTable from "./PartsInvoicesTable.jsx";

// --- Dropdown constants ---
const LIMIT_OPTIONS = [5, 25, 50, 100];

export default function PartsPurchase({ isAdmin = false }) {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    // suppliers + parts
    const { suppliers } = useSuppliers();
    const { parts } = useParts();

    // invoices
    const {
        invoices,
        pagination,
        params,
        loading,
        refetch,
        setParams,
    } = usePurchaseInvoices({
        isAdmin,
        initialParams: { page: 1, limit: 25, sortBy: "createdAt", sortOrder: "desc" },
    });

    // filter drafts
    const [draft, setDraft] = useState({
        search: "",
        supplier: "",
        part: "",
        paymentStatus: "",
        vendorInvoiceNumber: "",
        startDate: "",
        endDate: "",
        purchaser: "",
        limit: 25,
        sortBy: "createdAt",
        sortOrder: "desc",
    });
    const [applied, setApplied] = useState(draft);

    const applyFilters = () => {
        setApplied(draft);
        const newParams = { ...draft, page: 1 };
        setParams(newParams);
        refetch(newParams);
    };

    const resetFilters = () => {
        const fresh = {
            search: "",
            supplier: "",
            part: "",
            paymentStatus: "",
            vendorInvoiceNumber: "",
            startDate: "",
            endDate: "",
            purchaser: "",
            limit: 25,
            sortBy: "createdAt",
            sortOrder: "desc",
        };
        setDraft(fresh);
        setApplied(fresh);
        const newParams = { ...fresh, page: 1 };
        setParams(newParams);
        refetch(newParams);
    };

    // summarize API params for ParamsSummary
    const paramsSummary = useMemo(() => {
        return {
            ...(params || applied),
            perPage: params?.limit || applied.limit,
            page: pagination?.page || 1,
            sortBy: params?.sortBy || "createdAt",
            sortOrder: params?.sortOrder || "desc",
        };
    }, [params, applied, pagination]);

    return (
        <div className="p-6 relative min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-blue-900">
                    Parts Purchase Invoices
                </h1>
                <Button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                    onClick={() => {
                        setSelectedInvoiceId(null);
                        setIsInvoiceModalOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Filters */}
            <div className="mb-3 space-y-3 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Input
                        placeholder="Search Vehicle / Part"
                        value={draft.search}
                        onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                        className="w-full"
                    />
                    <select
                        value={draft.supplier}
                        onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map((s) => (
                            <option key={s._id} value={s._id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={draft.part}
                        onChange={(e) => setDraft({ ...draft, part: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">All Parts</option>
                        {parts.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.partNumber ? `${p.partName} (${p.partNumber})` : p.partName}
                            </option>
                        ))}
                    </select>
                    <select
                        value={draft.paymentStatus}
                        onChange={(e) =>
                            setDraft({ ...draft, paymentStatus: e.target.value })
                        }
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">All Status</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                    </select>
                    <Input
                        placeholder="Vendor Invoice #"
                        value={draft.vendorInvoiceNumber}
                        onChange={(e) =>
                            setDraft({ ...draft, vendorInvoiceNumber: e.target.value })
                        }
                        className="w-full"
                    />
                    <Input
                        type="date"
                        value={draft.startDate}
                        onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                        className="w-full"
                    />
                    <Input
                        type="date"
                        value={draft.endDate}
                        onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                        className="w-full"
                    />
                    {isAdmin && (
                        <Input
                            placeholder="Purchaser ID..."
                            value={draft.purchaser}
                            onChange={(e) =>
                                setDraft({ ...draft, purchaser: e.target.value })
                            }
                            className="w-full"
                        />
                    )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        <select
                            value={draft.limit}
                            onChange={(e) =>
                                setDraft({ ...draft, limit: Number(e.target.value) })
                            }
                            className="border rounded px-3 py-2 w-full"
                        >
                            {LIMIT_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 md:ml-4">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Params Summary */}
            <ParamsSummary params={paramsSummary} />

            {/* Table */}
            <PartsInvoicesTable
                invoices={invoices}
                loading={loading}
                onViewEdit={(id) => {
                    setSelectedInvoiceId(id);
                    setIsInvoiceModalOpen(true);
                }}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">
                    Total Invoices: {pagination?.total || 0}
                </p>
                <div className="flex items-center gap-4">
                    <button
                        disabled={!pagination?.hasPrevPage}
                        onClick={() => refetch({ page: (pagination?.page || 1) - 1 })}
                        className={`px-3 py-1 rounded ${pagination?.hasPrevPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Prev
                    </button>
                    <span className="text-sm">
                        Page {pagination?.page || 1} of {pagination?.totalPages || 1}
                    </span>
                    <button
                        disabled={!pagination?.hasNextPage}
                        onClick={() => refetch({ page: (pagination?.page || 1) + 1 })}
                        className={`px-3 py-1 rounded ${pagination?.hasNextPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Invoice Modal */}
            {isInvoiceModalOpen && (
                <PartsInvoiceModal
                    invoiceId={selectedInvoiceId}
                    isOpen={isInvoiceModalOpen}
                    onClose={() => {
                        setIsInvoiceModalOpen(false);
                        refetch({ page: pagination?.page || 1 });
                    }}
                />
            )}
        </div>
    );
}
