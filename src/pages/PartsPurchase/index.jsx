import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

import { useSuppliers } from "../../hooks/useSuppliers.js";
import { useParts } from "../../hooks/useParts.js";
import useUsers from "../../hooks/useUsers.js";
import { usePurchaseInvoices } from "../../hooks/usePurchaseInvoices.js";

import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import PartsInvoiceModal from "./PartsInvoiceModal.jsx";
import PartsInvoicesTable from "./PartsInvoicesTable.jsx";
import PartCreateModal from "./CreatePartModal.jsx"; // ✅ added import

// --- Dropdown constants ---
const LIMIT_OPTIONS = [5, 25, 50, 100];

// --- Default filter state (VAT removed) ---
const DEFAULT_FILTERS = {
    search: "",
    supplier: "",
    part: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    purchaser: "",
    limit: 25,
    sortBy: "createdAt",
    sortOrder: "desc",
};

export default function PartsPurchase({ isAdmin = false }) {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    // ✅ new state for part modal
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);

    // suppliers + parts
    const { suppliers } = useSuppliers();
    const { parts, refetch: refetchParts } = useParts();

    // users
    const {
        list: userOptions,
        map: userMap,
        loading: loadingUsers,
        error: usersError,
    } = useUsers({ useSessionCache: true });

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
        initialParams: { page: 1, ...DEFAULT_FILTERS },
    });

    // local filters
    const [draft, setDraft] = useState(DEFAULT_FILTERS);
    const [applied, setApplied] = useState(DEFAULT_FILTERS);

    // 🟢 Clean empty values before sending to backend
    const cleanParams = (obj) =>
        Object.fromEntries(
            Object.entries(obj).filter(
                ([, v]) => v !== "" && v !== null && v !== undefined
            )
        );

    const applyFilters = () => {
        const payload = {
            ...draft,
            startDate: draft.startDate ? new Date(draft.startDate) : undefined,
            endDate: draft.endDate ? new Date(draft.endDate) : undefined,
        };

        setApplied(payload);
        const newParams = { ...cleanParams(payload), page: 1 };
        setParams(newParams);
        refetch(newParams);
    };

    const resetFilters = () => {
        setDraft(DEFAULT_FILTERS);
        setApplied(DEFAULT_FILTERS);
        const newParams = { ...DEFAULT_FILTERS, page: 1 };
        setParams(newParams);
        refetch(newParams);
    };

    // summarize API params for ParamsSummary
    const paramsSummary = useMemo(() => {
        return {
            ...(params || applied),
            perPage: params?.limit || applied.limit,
            page: pagination?.page || 1,
            sortBy: params?.sortBy || DEFAULT_FILTERS.sortBy,
            sortOrder: params?.sortOrder || DEFAULT_FILTERS.sortOrder,
        };
    }, [params, applied, pagination]);

    // build supplier/part maps for ParamsSummary
    const supplierMap = useMemo(
        () => Object.fromEntries(suppliers.map((s) => [s._id, s.name])),
        [suppliers]
    );
    const partMap = useMemo(
        () =>
            Object.fromEntries(
                parts.map((p) => [
                    p._id,
                    p.partNumber ? `${p.partName} (${p.partNumber})` : p.partName,
                ])
            ),
        [parts]
    );

    return (
        <div className="p-6 relative min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-blue-900">
                    Parts Purchase Invoices
                </h1>
                <div className="flex gap-3">
                    {/* ✅ Create Part */}
                    <Button
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                        onClick={() => setIsPartModalOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Create Part
                    </Button>

                    {/* Create Invoice */}
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
            </div>

            {/* Filters */}
            <div className="mb-3 space-y-3 bg-white p-4 rounded-lg shadow">
                {/* Line 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <Input
                        placeholder="Search Invoice # / Vehicle / Part"
                        value={draft.search}
                        onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                        className="w-full"
                    />

                    {/* Start Date */}
                    <Input
                        type="date"
                        value={draft.startDate}
                        onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                        className="w-full"
                    />

                    {/* End Date */}
                    <Input
                        type="date"
                        value={draft.endDate}
                        onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                        className="w-full"
                    />

                    {/* Payment Status */}
                    <select
                        value={draft.paymentStatus}
                        onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>

                    {/* Per Page */}
                    <select
                        value={draft.limit}
                        onChange={(e) => setDraft({ ...draft, limit: Number(e.target.value) })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        {LIMIT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt} / page
                            </option>
                        ))}
                    </select>
                </div>

                {/* Line 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Sort By */}
                    <select
                        value={draft.sortBy}
                        onChange={(e) => setDraft({ ...draft, sortBy: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="createdAt">Created At</option>
                        <option value="paymentDate">Payment Date</option>
                    </select>

                    {/* Sort Order */}
                    <select
                        value={draft.sortOrder}
                        onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>

                    {/* Supplier */}
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

                    {/* Part */}
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

                    {/* Purchaser */}
                    <select
                        value={draft.purchaser}
                        onChange={(e) => setDraft({ ...draft, purchaser: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        disabled={loadingUsers}
                    >
                        <option value="">
                            {loadingUsers ? "Loading purchasers..." : "All Purchasers"}
                        </option>
                        {usersError ? (
                            <option disabled value="">
                                Failed to load users
                            </option>
                        ) : (
                            userOptions.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.username}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Action Buttons (Centered) */}
                <div className="flex justify-center gap-3 mt-4">
                    <button
                        onClick={applyFilters}
                        className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Apply
                    </button>
                    <button
                        onClick={resetFilters}
                        className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Params Summary */}
            <ParamsSummary
                params={paramsSummary}
                userMap={userMap}
                supplierMap={supplierMap}
                partMap={partMap}
            />

            {/* Table with spinner */}
            {loading ? (
                <div className="bg-white p-6 rounded-lg shadow flex justify-center">
                    <InlineSpinner label="Loading purchase invoices…" />
                </div>
            ) : (
                <PartsInvoicesTable
                    invoices={invoices}
                    onViewEdit={(id) => {
                        setSelectedInvoiceId(id);
                        setIsInvoiceModalOpen(true);
                    }}
                />
            )}

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

            {/* ✅ Part Modal */}
            {isPartModalOpen && (
                <PartCreateModal
                    isOpen={isPartModalOpen}
                    onClose={() => {
                        setIsPartModalOpen(false);
                        refetchParts(); // refresh part list after new part
                    }}
                />
            )}
        </div>
    );
}
