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

    // ✅ ensure paymentStatus is valid or removed
    if (
        normalized.paymentStatus &&
        !["Paid", "Partial", "Unpaid"].includes(normalized.paymentStatus)
    ) {
        delete normalized.paymentStatus;
    }

    // ✅ ensure dates are Date objects
    if (normalized.startDate) {
        normalized.startDate = new Date(normalized.startDate);
    }
    if (normalized.endDate) {
        normalized.endDate = new Date(normalized.endDate);
    }

    return cleanParams(normalized);
};

export function usePurchaseInvoices({ initialParams = {} } = {}) {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);

    // 🔹 Fetch invoices list
    const fetchInvoices = useCallback(async (overrideParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            const mergedParams = normalizeParams({
                ...paramsRef.current,
                ...overrideParams,
            });

            const res = await PurchaseInvoiceApi.getInvoices(mergedParams);

            if (res.success) {
                setInvoices(res.data || []);
                setPagination(res.pagination || null);
                setParams(res.params || mergedParams);
                paramsRef.current = res.params || mergedParams;
            } else {
                const errMsg = res.error || "Failed to fetch invoices";
                setError(errMsg);
                toast.error(`❌ ${errMsg}`);
            }
        } catch (err) {
            setError(err.message);
            toast.error(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔹 Run once on mount
    useEffect(() => {
        fetchInvoices(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        invoices, // list of invoices
        pagination, // { total, page, limit, totalPages, ... }
        params, // current filters/sorting
        loading,
        error,
        refetch: fetchInvoices,
        setParams: (newParams) => {
            paramsRef.current = { ...paramsRef.current, ...newParams };
            setParams(paramsRef.current);
        },
    };
}
