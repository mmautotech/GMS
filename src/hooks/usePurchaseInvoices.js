// src/hooks/usePurchaseInvoices.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PurchaseInvoiceApi from "../lib/api/purchaseInvoiceApi.js";

export function usePurchaseInvoices({ isAdmin = false, initialParams = {} } = {}) {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);

    // 🔹 Fetch invoices list
    const fetchInvoices = useCallback(
        async (overrideParams = {}, silent = false) => {
            if (!silent) setLoading(true);
            setError(null);

            try {
                const mergedParams = { ...paramsRef.current, ...overrideParams };
                const res = isAdmin
                    ? await PurchaseInvoiceApi.getAllInvoices(mergedParams)
                    : await PurchaseInvoiceApi.getMyInvoices(mergedParams);

                if (res.success) {
                    setInvoices(res.data || []);
                    setPagination(res.pagination || null);
                    setParams(mergedParams);
                    paramsRef.current = mergedParams;
                } else {
                    setError(res.error || "Failed to fetch invoices");
                    toast.error(res.error || "Failed to fetch invoices");
                }
            } catch (err) {
                setError(err.message);
                toast.error(`❌ ${err.message}`);
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [isAdmin]
    );

    // 🔹 Run only once on mount (respect initialParams)
    useEffect(() => {
        fetchInvoices(initialParams, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]); // run again if admin mode changes

    return {
        invoices,
        pagination,
        params,
        loading,
        error,
        refetch: fetchInvoices,
        setParams,
    };
}
