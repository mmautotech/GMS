import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getAllInternalInvoices } from "../lib/api/internalinvoiceApi";

/**
 * Custom hook to manage fetching, filtering, and paginating internal invoices
 * Fully consistent with backend fields and params.
 */
export function useInternalInvoices(initialFilters = {}) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // ✅ Backend Totals
    const [totalSales, setTotalSales] = useState(0);
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [totalNetVat, setTotalNetVat] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);

    // ✅ Backend Params (for summary display)
    const [backendParams, setBackendParams] = useState({});

    // ✅ Filters
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        fromDate: "",
        toDate: "",
        sortOn: "landingDate",
        sortOrder: "desc",
        ...initialFilters,
    });

    // ✅ Fetch Invoices from Backend
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllInternalInvoices({ page, limit, ...filters });

            if (res.success) {
                setInvoices(res.data || []);
                setTotalPages(res.pagination?.totalPages || 1);
                setTotalCount(res.pagination?.total || 0);

                const t = res.totals || {};
                setTotalSales(Number(t.totalSales || 0));
                setTotalPurchases(Number(t.totalPurchases || 0));
                setTotalNetVat(Number(t.totalNetVat || 0));
                setTotalProfit(Number(t.totalProfit || 0));

                // ✅ Capture backend query params (what server actually used)
                setBackendParams(res.params || {});
            } else {
                // ❌ Reset all on backend failure
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
            // Reset backend params on error
            setBackendParams({});
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    // ✅ Reset all filters and state
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

    // ✅ Toggle sort field / order
    const toggleSort = useCallback((field) => {
        setFilters((prev) =>
            prev.sortOn === field
                ? { ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }
                : { ...prev, sortOn: field, sortOrder: "asc" }
        );
    }, []);

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
        backendParams, // ✅ added
        setFilters,
        setPage,
        setLimit,
        resetFilters,
        fetchInvoices,
        toggleSort,
    };
}
