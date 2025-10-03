// src/hooks/useBookings.js
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

const MEMO_CACHE = {}; // { [key]: { items, totalPages, totalItems, hasNextPage, hasPrevPage, at } }
const TTL_MS = 60 * 1000; // 1 minute TTL

export default function useBookings({
    status,
    fromDate,
    toDate,
    search = "",
    services,
    user,
    initialPage = 1,
    pageSize = 25,
    sortBy = "createdDate",
    sortDir,
} = {}) {
    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [page, setPage] = useState(initialPage);
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

    // --- Fetch bookings ---
    const fetchBookings = useCallback(async () => {
        setLoadingList(true);
        setError("");

        // Generate a cache key based on current filters & pagination
        const cacheKey = JSON.stringify({
            page,
            pageSize,
            sortBy,
            sortDir,
            status,
            fromDate,
            toDate,
            search,
            services,
            user,
        });

        const cached = MEMO_CACHE[cacheKey];
        if (cached && Date.now() - cached.at < TTL_MS) {
            setItems(cached.items || []);
            setTotalPages(cached.totalPages || 1);
            setTotalItems(cached.totalItems || 0);
            setHasNextPage(cached.hasNextPage || false);
            setHasPrevPage(cached.hasPrevPage || false);
            setActiveParams(cached.params || null);
            setMeta(cached.meta || null);
            setLoadingList(false);
            return;
        }

        try {
            const res = await BookingApi.getBookings({
                page,
                limit: pageSize,
                sortBy,
                sortDir,
                status,
                fromDate,
                toDate,
                search,
                services,
                user,
            });

            if (!mounted.current) return;

            if (res.ok) {
                const normalizedItems = (res.items || []).map((b) => ({
                    ...b,
                    _id: b._id || b.id,
                    rowNumber: b.rowNumber ?? 0,
                }));

                setItems(normalizedItems);
                setTotalPages(res.pagination?.totalPages ?? 1);
                setTotalItems(res.pagination?.total ?? 0);
                setHasNextPage(res.pagination?.hasNextPage ?? false);
                setHasPrevPage(res.pagination?.hasPrevPage ?? false);
                setActiveParams(res.params || null);
                setMeta(res.meta || null);

                MEMO_CACHE[cacheKey] = {
                    items: normalizedItems,
                    totalPages: res.pagination?.totalPages ?? 1,
                    totalItems: res.pagination?.total ?? 0,
                    hasNextPage: res.pagination?.hasNextPage ?? false,
                    hasPrevPage: res.pagination?.hasPrevPage ?? false,
                    params: res.params || null,
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
    }, [
        page,
        pageSize,
        sortBy,
        sortDir,
        status,
        fromDate,
        toDate,
        search,
        services,
        user,
    ]);

    // Auto-fetch when dependencies change
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Auto-refresh every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            fetchBookings();
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchBookings]);

    // --- Create booking ---
    const create = async (payload) => {
        setError("");
        setSaving(true);
        try {
            const res = await BookingApi.createBooking(payload);
            if (res.ok) {
                const newBooking = {
                    ...res.booking,
                    _id: res.booking._id || res.booking.id,
                };
                setItems((prev) => [newBooking, ...prev]);
                return { ok: true, booking: newBooking };
            } else {
                const msg = res.error || "Failed to create booking";
                setError(msg);
                return { ok: false, error: msg };
            }
        } catch (err) {
            const msg = err?.message || "Failed to create booking";
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

    // --- Update booking ---
    const update = async (id, patch) => {
        setError("");
        setSaving(true);
        try {
            if (!patch || Object.keys(patch).length === 0) {
                return { ok: false, error: "No changes detected" };
            }

            const res = await BookingApi.updateBooking(id, patch);
            if (res.ok) {
                const updatedBooking = {
                    ...res.booking,
                    _id: res.booking?._id || res.booking?.id || id,
                };

                setItems((prev) =>
                    res.booking
                        ? prev.map((b) => (b._id === id ? updatedBooking : b))
                        : prev
                );

                return { ok: true, booking: updatedBooking, message: res.message };
            } else {
                const msg = res.error || "Failed to update booking";
                setError(msg);
                return { ok: false, error: msg };
            }
        } catch (err) {
            const msg = err?.message || "Failed to update booking";
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

    // --- Update booking status ---
    const updateStatus = async (id, newStatus) => {
        setError("");
        setSaving(true);
        try {
            const res = await BookingApi.updateBookingStatus(id, newStatus);
            if (res.ok) {
                const updatedBooking = {
                    ...res.booking,
                    _id: res.booking._id || res.booking.id,
                };
                setItems((prev) =>
                    prev.map((b) => (b._id === id ? updatedBooking : b))
                );
                return { ok: true, booking: updatedBooking };
            } else {
                const msg = res.error || "Failed to update booking status";
                setError(msg);
                return { ok: false, error: msg };
            }
        } catch (err) {
            const msg = err?.message || "Failed to update booking status";
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

    // --- Export bookings CSV ---
    const exportCSV = async () => {
        if (!activeParams) return { ok: false, error: "No filters applied" };
        return await BookingApi.exportBookings(activeParams);
    };

    // --- Manual refresh ---
    const refresh = () => fetchBookings();

    return {
        items,
        list: useMemo(() => items, [items]),
        setList: setItems,

        loadingList,
        saving,
        error,
        setError,

        page,
        setPage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        pageSize,

        params: activeParams,
        meta,

        fetchBookings,
        refresh,
        create,
        update,
        updateStatus,
        exportCSV,
    };
}
