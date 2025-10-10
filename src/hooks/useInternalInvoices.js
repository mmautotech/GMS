import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getAllInternalInvoices } from "../lib/api/internalinvoiceApi";

/**
 * 🔹 Custom Hook — useInternalInvoices
 * Handles fetching, filtering, sorting, and pagination for Internal Invoices
 * 100% aligned with backend (Zod schema + routes)
 */
export function useInternalInvoices(initialFilters = {}) {
    // -------------------------------
    // 📦 Core State
    // -------------------------------
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // -------------------------------
    // 📊 Totals
    // -------------------------------
    const [totalSales, setTotalSales] = useState(0);
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [totalNetVat, setTotalNetVat] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);

    // -------------------------------
    // 🧾 Backend params (for debugging / ParamsSummary)
    // -------------------------------
    const [backendParams, setBackendParams] = useState({});

    // -------------------------------
    // 🔍 Filters (same structure as backend validator)
    // -------------------------------
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        fromDate: "",
        toDate: "",
        sortOn: "landingDate",
        sortOrder: "desc",
        ...initialFilters,
    });

    // -------------------------------
    // 🚀 Fetch Internal Invoices
    // -------------------------------
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);

            const res = await getAllInternalInvoices({
                page,
                limit,
                ...filters,
            });

            if (res.success) {
                // ✅ Data
                setInvoices(Array.isArray(res.data) ? res.data : []);

                // ✅ Pagination
                setTotalPages(res.pagination?.totalPages || 1);
                setTotalCount(res.pagination?.total || res.data?.length || 0);

                // ✅ Totals
                const t = res.totals || {};
                setTotalSales(Number(t.totalSales || 0));
                setTotalPurchases(Number(t.totalPurchases || 0));
                setTotalNetVat(Number(t.totalNetVat || 0));
                setTotalProfit(Number(t.totalProfit || 0));

                // ✅ Capture backend params
                setBackendParams(res.params || {});
            } else {
                // ❌ Reset if backend response failed
                setInvoices([]);
                setTotalPages(1);
                setTotalCount(0);
                setTotalSales(0);
                setTotalPurchases(0);
                setTotalNetVat(0);
                setTotalProfit(0);
                setBackendParams({});
            }
        } catch (error) {
            console.error("❌ Error fetching internal invoices:", error);
            toast.error("Failed to load internal invoices");
            setInvoices([]);
            setBackendParams({});
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    // -------------------------------
    // ♻️ Reset Filters and State
    // -------------------------------
    const resetFilters = useCallback(() => {
        const defaultFilters = {
            search: "",
            status: "",
            fromDate: "",
            toDate: "",
            sortOn: "landingDate",
            sortOrder: "desc",
        };
        setFilters(defaultFilters);
        setPage(1);
        setLimit(25);
        setInvoices([]);
        setTotalPages(1);
        setTotalCount(0);
        setTotalSales(0);
        setTotalPurchases(0);
        setTotalNetVat(0);
        setTotalProfit(0);
        setBackendParams({});
    }, []);

    // -------------------------------
    // ↕️ Toggle Sort Field
    // -------------------------------
    const toggleSort = useCallback((field) => {
        setFilters((prev) =>
            prev.sortOn === field
                ? { ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }
                : { ...prev, sortOn: field, sortOrder: "asc" }
        );
    }, []);

    // -------------------------------
    // 📦 Return Unified API
    // -------------------------------
    return {
        invoices,
        loading,
        page,
        limit,
        totalPages,
        totalCount,
        totalSales,
        totalPurchases,
        totalNetVat,
        totalProfit,
        filters,
        backendParams,
        setFilters,
        setPage,
        setLimit,
        resetFilters,
        fetchInvoices,
        toggleSort,
    };
}
