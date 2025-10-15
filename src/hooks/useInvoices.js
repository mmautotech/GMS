import { useEffect, useState, useCallback, useRef } from "react";
import { InvoiceApi } from "../lib/api/invoiceApi.js";
import { toast } from "react-toastify";

/**
 * 🧾 useInvoices — unified data hook for invoice listing
 * Supports: search, date range, status, pagination & sorting.
 * Aligned with backend validator (limit ∈ [10,10,50,100], default 10).
 */
export default function useInvoices(initialFilters = {}) {
    const [invoices, setInvoices] = useState([]);
    const [totals, setTotals] = useState({});
    const [pagination, setPagination] = useState({});
    const [params, setParams] = useState({});
    const [loading, setLoading] = useState(false);

    // ✅ Default filters (match backend defaults)
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        fromDate: "",
        toDate: "",
        limit: 10,
        page: 1,
        sortOn: "createdAt",
        sortOrder: "desc",
        ...initialFilters,
    });

    const debounceTimer = useRef(null);

    // ---------------- Fetch Invoices ----------------
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);

            const res = await InvoiceApi.getAllInvoices({
                page: filters.page,
                limit: filters.limit,
                search: filters.search?.trim() || undefined,
                status: filters.status || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                sortOn: filters.sortOn || "createdAt",
                sortOrder: filters.sortOrder || "desc",
            });

            setInvoices(res.invoices || []);
            setTotals(res.totals || {});
            setPagination(res.pagination || {});
            setParams(res.params || {});
        } catch (err) {
            console.error("❌ useInvoices fetch error:", err);
            toast.error(err.message || "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // ---------------- Debounced Fetch ----------------
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchInvoices();
        }, 400); // 400ms debounce
        return () => clearTimeout(debounceTimer.current);
    }, [fetchInvoices]);

    // ---------------- Filter Updaters ----------------
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === "search" || key === "status" || key === "fromDate" || key === "toDate" ? 1 : prev.page,
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            status: "",
            fromDate: "",
            toDate: "",
            limit: 10,
            page: 1,
            sortOn: "createdAt",
            sortOrder: "desc",
        });
    };

    // ---------------- Return API ----------------
    return {
        invoices,
        totals,
        pagination,
        params,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        loading,
        refresh: fetchInvoices,
    };
}
