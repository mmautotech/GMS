// src/hooks/usePurchaseInvoices.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PurchaseInvoiceApi from "../lib/api/purchaseInvoiceApi.js";

// helper: clean params
const cleanParams = (obj) =>
    Object.fromEntries(
        Object.entries(obj).filter(
            ([, v]) => v !== "" && v !== null && v !== undefined
        )
    );

// helper: normalize filters before API
const normalizeParams = (params) => {
    const normalized = { ...params };

    if (
        normalized.paymentStatus &&
        !["Paid", "Partial", "Unpaid"].includes(normalized.paymentStatus)
    ) {
        delete normalized.paymentStatus;
    }

    if (normalized.startDate) normalized.startDate = new Date(normalized.startDate);
    if (normalized.endDate) normalized.endDate = new Date(normalized.endDate);

    return cleanParams(normalized);
};

// simple in-memory cache: { [key]: { data, pagination, params, at } }
const MEMO_CACHE = {};
const TTL_MS = 60 * 1000; // 1 minute

export function usePurchaseInvoices({ initialParams = {} } = {}) {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchInvoices = useCallback(async (overrideParams = {}, force = false) => {
        setLoading(true);
        setError(null);

        try {
            const mergedParams = normalizeParams({ ...paramsRef.current, ...overrideParams });
            const cacheKey = JSON.stringify(mergedParams);

            const cached = MEMO_CACHE[cacheKey];
            if (!force && cached && Date.now() - cached.at < TTL_MS) {
                setInvoices(cached.data || []);
                setPagination(cached.pagination || null);
                setParams(cached.params || mergedParams);
                return;
            }

            const res = await PurchaseInvoiceApi.getInvoices(mergedParams);

            if (!mounted.current) return;

            if (res.success) {
                setInvoices(res.data || []);
                setPagination(res.pagination || null);
                setParams(res.params || mergedParams);
                paramsRef.current = res.params || mergedParams;

                MEMO_CACHE[cacheKey] = {
                    data: res.data || [],
                    pagination: res.pagination || null,
                    params: res.params || mergedParams,
                    at: Date.now(),
                };
            } else {
                const errMsg = res.error || "Failed to fetch invoices";
                setError(errMsg);
                toast.error(`❌ ${errMsg}`);
            }
        } catch (err) {
            if (!mounted.current) return;
            setError(err.message);
            toast.error(`❌ ${err.message}`);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        fetchInvoices(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-refresh every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            fetchInvoices(paramsRef.current, true);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchInvoices]);

    const manualRefresh = useCallback(() => {
        fetchInvoices(paramsRef.current, true);
    }, [fetchInvoices]);

    return {
        invoices,
        pagination,
        params,
        loading,
        error,
        refetch: manualRefresh,
        setParams: (newParams) => {
            paramsRef.current = { ...paramsRef.current, ...newParams };
            setParams(paramsRef.current);
            fetchInvoices(paramsRef.current);
        },
    };
}
