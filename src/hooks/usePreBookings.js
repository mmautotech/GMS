import { useState, useEffect, useCallback, useMemo } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

/**
 * Hook to fetch pre-bookings (pending only) with params and pagination.
 */
export default function usePreBookings(initialParams = {}) {
    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [error, setError] = useState("");

    // pagination state
    const [page, setPage] = useState(initialParams.page || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);

    // backend-echoed params/meta
    const [activeParams, setActiveParams] = useState(null);
    const [meta, setMeta] = useState(null);

    // --- Core fetch ---
    const fetchBookings = useCallback(
        async (params = {}) => {
            setLoadingList(true);
            setError("");
            try {
                const res = await BookingApi.getPendingBookings({
                    ...initialParams,
                    ...params,
                    page,
                });

                if (res?.success || res?.ok) {
                    const normalized = (res.data || res.items || []).map((b) => ({
                        ...b,
                        _id: b._id || b.id,
                        rowNumber: b.rowNumber ?? 0,
                    }));

                    setItems(normalized);
                    setTotalPages(res.pagination?.totalPages ?? 1);
                    setTotalItems(res.pagination?.total ?? 0);
                    setHasNextPage(res.pagination?.hasNextPage ?? false);
                    setHasPrevPage(res.pagination?.hasPrevPage ?? false);

                    // Use backend params if present, otherwise fall back to what we sent
                    setActiveParams(res.params || { ...initialParams, page });
                    setMeta(res.meta || null);
                } else {
                    setError(res.error || "Failed to fetch bookings");
                }
            } catch (err) {
                setError(err?.message || "Failed to fetch bookings");
            } finally {
                setLoadingList(false);
            }
        },
        [initialParams, page]
    );

    // auto-run when params or page change
    useEffect(() => {
        fetchBookings(initialParams);
    }, [fetchBookings, initialParams]);

    // manual refresh
    const refresh = useCallback(() => {
        fetchBookings(initialParams);
    }, [fetchBookings, initialParams]);

    return {
        // data
        items,
        list: useMemo(() => items, [items]),
        setList: setItems,

        // status
        loadingList,
        error,
        setError,

        // pagination
        page,
        setPage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        pageSize: initialParams.limit || 25,

        // backend params/meta
        params: activeParams,
        meta,

        // actions
        fetchBookings,
        refresh,
    };
}
