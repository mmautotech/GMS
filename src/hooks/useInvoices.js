// src/hooks/useInvoices.js
import { useEffect, useState, useCallback } from "react";
import { InvoiceApi } from "../lib/api/invoiceApi.js";
import { toast } from "react-toastify";

/**
 * useInvoices — central hook for listing & stats
 * Handles filters, pagination, and totals in sync with backend.
 */
export default function useInvoices(initialFilters = {}) {
    const [invoices, setInvoices] = useState([]);
    const [totals, setTotals] = useState({});
    const [pagination, setPagination] = useState({});
    const [params, setParams] = useState({});
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        fromDate: "",
        toDate: "",
        limit: 25,
        page: 1,
        ...initialFilters,
    });
    const [loading, setLoading] = useState(false);

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const res = await InvoiceApi.getAllInvoices({
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
                status: filters.status || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
            });

            setInvoices(res.invoices || res.data || []);
            setTotals(res.totals || {});
            setPagination(res.pagination || {});
            setParams(res.params || {});
        } catch (err) {
            console.error("❌ useInvoices fetch error:", err);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return {
        invoices,
        totals,
        pagination,
        params,
        filters,
        setFilters,
        loading,
        refresh: fetchInvoices,
    };
}
