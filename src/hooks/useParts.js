// src/hooks/useParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PartsApi from "../lib/api/partsApi.js";

// In-memory cache: { [key]: { parts, pagination, at } }
const MEMO_CACHE = {};
const TTL_MS = 60 * 1000; // 1 minute TTL

export function useParts(initialParams = {}, bookingId = null) {
    const [parts, setParts] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);
    const mounted = useRef(true);

    // Track mounted state to prevent state updates on unmounted component
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // Fetch parts with caching
    const fetchParts = useCallback(async (overrideParams = {}) => {
        setLoading(true);
        setError(null);

        const mergedParams = { ...paramsRef.current, ...overrideParams };
        const cacheKey = bookingId
            ? `booking-${bookingId}`
            : `general-${JSON.stringify(mergedParams)}`;

        // Serve from cache if valid
        const cached = MEMO_CACHE[cacheKey];
        if (cached && Date.now() - cached.at < TTL_MS) {
            setParts(cached.parts || []);
            setPagination(cached.pagination || { page: 1, limit: 10, total: 0 });
            setLoading(false);
            return;
        }

        try {
            let res;
            if (bookingId) {
                res = await PartsApi.getPartsByBooking(bookingId);
            } else {
                res = await PartsApi.getParts(mergedParams);
                if (res.success && mounted.current) setParams(mergedParams);
                paramsRef.current = mergedParams;
            }

            if (!mounted.current) return;

            if (res.success) {
                setParts(res.parts || []);
                if (res.pagination) setPagination(res.pagination);

                MEMO_CACHE[cacheKey] = {
                    parts: res.parts || [],
                    pagination: res.pagination || { page: 1, limit: 10, total: 0 },
                    at: Date.now(),
                };
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
    }, [bookingId]);

    // Auto-fetch on mount & bookingId change
    useEffect(() => {
        fetchParts(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    // Auto-refresh cache every TTL_MS
    useEffect(() => {
        const interval = setInterval(() => {
            fetchParts(paramsRef.current);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchParts]);

    // Manual refresh
    const manualRefresh = useCallback(() => {
        const bookingKey = `booking-${bookingId}`;
        const generalKey = `general-${JSON.stringify(paramsRef.current)}`;

        if (bookingId && MEMO_CACHE[bookingKey]) {
            MEMO_CACHE[bookingKey].at = 0;
        } else if (!bookingId && MEMO_CACHE[generalKey]) {
            MEMO_CACHE[generalKey].at = 0;
        }

        fetchParts(paramsRef.current);
    }, [fetchParts, bookingId]);

    return {
        parts,          // list of parts
        params,         // current query params
        pagination,     // { page, limit, total }
        loading,
        error,
        refetch: manualRefresh,
        setParams: (newParams) => {
            const updated = { ...paramsRef.current, ...newParams };
            paramsRef.current = updated;
            setParams(updated);
            fetchParts(updated);
        },
        setPage: (page) => {
            const updated = { ...paramsRef.current, page };
            paramsRef.current = updated;
            setParams(updated);
            fetchParts(updated);
        },
        setSearch: (q) => {
            const updated = { ...paramsRef.current, q, page: 1 };
            paramsRef.current = updated;
            setParams(updated);
            fetchParts(updated);
        },
    };
}
