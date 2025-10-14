// src/hooks/useBookingsList.js
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";
import { socket } from "../context/socket.js"; // ✅ add this

const MEMO_CACHE = {};
const TTL_MS = 60 * 1000; // 60 seconds

function useBookingsList(fetcher, initialParams = {}) {
    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [error, setError] = useState("");

    const [page, setPage] = useState(initialParams.page || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);

    const [activeParams, setActiveParams] = useState(null);
    const [meta, setMeta] = useState(null);

    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchBookings = useCallback(
        async (params = {}) => {
            setLoadingList(true);
            setError("");

            const mergedParams = { ...initialParams, ...params, page };
            const cacheKey = JSON.stringify({ fetcher: fetcher.name, ...mergedParams });

            const cached = MEMO_CACHE[cacheKey];
            if (!params.force && cached && Date.now() - cached.at < TTL_MS) {
                setItems(cached.items || []);
                setTotalPages(cached.totalPages || 1);
                setTotalItems(cached.totalItems || 0);
                setHasNextPage(cached.hasNextPage || false);
                setHasPrevPage(cached.hasPrevPage || false);
                setActiveParams(cached.params || mergedParams);
                setMeta(cached.meta || null);
                setLoadingList(false);
                return;
            }

            if (params.force) delete MEMO_CACHE[cacheKey];

            try {
                const res = await fetcher(mergedParams);
                if (!mounted.current) return;

                if (res?.ok) {
                    const normalized = (res.items || []).map((b) => ({
                        ...b,
                        _id: b._id || b.id,
                        rowNumber: b.rowNumber ?? 0,
                    }));

                    setItems(normalized);
                    setTotalPages(res.pagination?.totalPages ?? 1);
                    setTotalItems(res.pagination?.total ?? 0);
                    setHasNextPage(res.pagination?.hasNextPage ?? false);
                    setHasPrevPage(res.pagination?.hasPrevPage ?? false);
                    setActiveParams(res.params || mergedParams);
                    setMeta(res.meta || null);

                    MEMO_CACHE[cacheKey] = {
                        items: normalized,
                        totalPages: res.pagination?.totalPages ?? 1,
                        totalItems: res.pagination?.total ?? 0,
                        hasNextPage: res.pagination?.hasNextPage ?? false,
                        hasPrevPage: res.pagination?.hasPrevPage ?? false,
                        params: res.params || mergedParams,
                        meta: res.meta || null,
                        at: Date.now(),
                    };
                } else {
                    setError(res.error || "Failed to fetch bookings");
                }
            } catch (err) {
                if (!mounted.current) return;
                setError(err?.message || "Failed to fetch bookings");
            } finally {
                if (mounted.current) setLoadingList(false);
            }
        },
        [fetcher, initialParams, page]
    );

    // Auto-run when dependencies change
    useEffect(() => {
        fetchBookings(initialParams);
    }, [fetchBookings, initialParams]);

    // ✅ Manual refresh
    const refresh = useCallback(() => {
        fetchBookings({ ...initialParams, force: true });
    }, [fetchBookings, initialParams]);

    // Auto-refresh every 60 sec
    useEffect(() => {
        const interval = setInterval(() => {
            fetchBookings(initialParams);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchBookings, initialParams]);

    // ✅ Listen for real-time status changes
    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = (data) => {
            if (data?.status === "arrived") {
                console.log("🔄 Refreshing due to arrived status", data);
                refresh(); // 🔁 reload the list for all users
            }
        };

        socket.on("booking:statusChanged", handleStatusChange);

        return () => {
            socket.off("booking:statusChanged", handleStatusChange);
        };
    }, [refresh]);

    return {
        items,
        list: useMemo(() => items, [items]),
        setList: setItems,
        loadingList,
        error,
        setError,
        page,
        setPage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        pageSize: initialParams.limit || 25,
        params: activeParams,
        meta,
        fetchBookings,
        refresh,
    };
}

// Wrappers
export function usePreBookings(initialParams = {}) {
    return useBookingsList(BookingApi.getPendingBookings, initialParams);
}
export function useArrivedBookings(initialParams = {}) {
    return useBookingsList(BookingApi.getArrivedBookings, initialParams);
}
