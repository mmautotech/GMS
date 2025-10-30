// src/hooks/useParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PartsApi from "../lib/api/partsApi.js";
import ServiceApi from "../lib/api/serviceApi.js";

// In-memory cache
const MEMO_CACHE = {};
const TTL_MS = 40 * 1000; // 1 min TTL

export function useParts({ initialParams = {}, bookingId = null, serviceId = null } = {}) {
    const [parts, setParts] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
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

    // ✅ Fetch parts with caching
    const fetchParts = useCallback(
        async (overrideParams = {}) => {
            setLoading(true);
            setError(null);

            const mergedParams = { ...paramsRef.current, ...overrideParams };
            const cacheKey = bookingId
                ? `booking-${bookingId}`
                : serviceId
                    ? `service-${serviceId}`
                    : `general-${JSON.stringify(mergedParams)}`;

            // Check cache
            const cached = MEMO_CACHE[cacheKey];
            if (cached && Date.now() - cached.at < TTL_MS) {
                if (!mounted.current) return;
                setParts(cached.parts);
                setPagination(cached.pagination);
                setLoading(false);
                return;
            }

            try {
                let res;
                if (bookingId) {
                    res = await PartsApi.getPartsByBooking(bookingId);
                } else if (serviceId) {
                    res = await ServiceApi.getServiceParts(serviceId);
                } else {
                    res = await PartsApi.getParts(mergedParams);
                    if (res.success && mounted.current) {
                        paramsRef.current = mergedParams;
                        setParams(mergedParams);
                    }
                }

                if (!mounted.current) return;

                if (res.success) {
                    const updatedPagination =
                        res.pagination || {
                            page: 1,
                            limit: res.parts?.length || 0,
                            total: res.parts?.length || 0,
                        };

                    setParts(res.parts || []);
                    setPagination(updatedPagination);

                    // Cache result
                    MEMO_CACHE[cacheKey] = {
                        parts: res.parts || [],
                        pagination: updatedPagination,
                        at: Date.now(),
                    };
                } else {
                    const errMsg = res.error || "Failed to fetch parts";
                    if (errMsg !== error) toast.error(`❌ ${errMsg}`);
                    setError(errMsg);
                    setParts([]);
                }
            } catch (err) {
                if (!mounted.current) return;
                const errMsg = err.message || "Unexpected error";
                if (errMsg !== error) toast.error(`❌ ${errMsg}`);
                setError(errMsg);
                setParts([]);
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        [bookingId, serviceId, error]
    );

    // Auto-fetch on mount / id change
    useEffect(() => {
        fetchParts(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId, serviceId]);

    // Auto-refresh every TTL
    useEffect(() => {
        const interval = setInterval(() => {
            fetchParts(paramsRef.current);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchParts]);

    // Manual refresh (invalidate cache)
    const manualRefresh = useCallback(() => {
        const bookingKey = `booking-${bookingId}`;
        const serviceKey = `service-${serviceId}`;
        const generalKey = `general-${JSON.stringify(paramsRef.current)}`;

        if (bookingId && MEMO_CACHE[bookingKey]) {
            MEMO_CACHE[bookingKey].at = 0;
        } else if (serviceId && MEMO_CACHE[serviceKey]) {
            MEMO_CACHE[serviceKey].at = 0;
        } else if (!bookingId && !serviceId && MEMO_CACHE[generalKey]) {
            MEMO_CACHE[generalKey].at = 0;
        }

        fetchParts(paramsRef.current);
    }, [fetchParts, bookingId, serviceId]);

    return {
        parts,
        params,
        pagination,
        loading,
        error,
        refetch: manualRefresh,
        setParams: (newParams) => fetchParts({ ...paramsRef.current, ...newParams }),
        setPage: (page) => fetchParts({ ...paramsRef.current, page }),
        setSearch: (q) => fetchParts({ ...paramsRef.current, q, page: 1 }),
    };
}
