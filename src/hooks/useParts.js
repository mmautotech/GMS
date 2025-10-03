// src/hooks/useParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PartsApi from "../lib/api/partsApi.js";

export function useParts(initialParams = {}, bookingId = null) {
    const [parts, setParts] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 }); // new
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);
    const mounted = useRef(true);

    // Cleanup & reset
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // ✅ Unified fetcher
    const fetchParts = useCallback(
        async (overrideParams = {}) => {
            setLoading(true);
            setError(null);

            try {
                let res;
                if (bookingId) {
                    // 🔹 Parts linked to booking
                    res = await PartsApi.getPartsByBooking(bookingId);
                } else {
                    // 🔹 General active parts with pagination/search
                    const mergedParams = { ...paramsRef.current, ...overrideParams };
                    res = await PartsApi.getParts(mergedParams);
                    if (res.success) {
                        paramsRef.current = mergedParams;
                        if (mounted.current) setParams(mergedParams);
                    }
                }

                if (!mounted.current) return;

                if (res.success) {
                    setParts(res.parts || []);
                    if (res.pagination) setPagination(res.pagination); // backend returns pagination
                } else {
                    const errMsg = res.error || "Failed to fetch parts";
                    setError(errMsg);
                    setParts([]);
                    toast.error(`❌ ${errMsg}`);
                }
            } catch (err) {
                if (!mounted.current) return;
                const errMsg = err.message || "Unexpected error";
                setError(errMsg);
                setParts([]);
                toast.error(`❌ ${errMsg}`);
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        [bookingId]
    );

    // ✅ Refetch on mount & bookingId change
    useEffect(() => {
        fetchParts(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    return {
        parts,          // list of parts
        params,         // current query params
        pagination,     // page, limit, total
        loading,
        error,
        refetch: fetchParts,
        setParams: (newParams) => {
            paramsRef.current = { ...paramsRef.current, ...newParams };
            setParams(paramsRef.current);
            fetchParts(paramsRef.current);
        },
        setPage: (page) => {
            const updated = { ...paramsRef.current, page };
            paramsRef.current = updated;
            setParams(updated);
            fetchParts(updated);
        },
        setSearch: (q) => {
            const updated = { ...paramsRef.current, q, page: 1 }; // reset to page 1 when searching
            paramsRef.current = updated;
            setParams(updated);
            fetchParts(updated);
        },
    };
}
