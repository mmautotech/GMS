// src/hooks/useBookings.js
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import _ from "lodash";
import { BookingApi } from "../lib/api/bookingApi.js";

const MEMO_CACHE = {}; // { [key]: { items, totalPages, totalItems, hasNextPage, hasPrevPage, params, meta, at } }
const TTL_MS = 40 * 1000;

export default function useBookings({
    status,
    fromDate,
    toDate,
    search = "",
    services,
    user,
    initialPage = 1,
    pageSize = 10,
    sortBy = "createdDate",
    sortDir = "desc",
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
    useEffect(() => () => { mounted.current = false; }, []);

    // ────────────────────────────── Fetch Bookings ──────────────────────────────
    const fetchBookings = useCallback(async () => {
        setLoadingList(true);
        setError("");

        const cacheKey = JSON.stringify({ page, pageSize, sortBy, sortDir, status, fromDate, toDate, search, services, user });
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
                user
            });

            if (!mounted.current) return;

            if (res.ok) {
                const normalizedItems = (res.items || []).map(b => ({
                    ...b,
                    _id: b._id || b.id,
                    rowNumber: b.rowNumber ?? 0
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
    }, [page, pageSize, sortBy, sortDir, status, fromDate, toDate, search, services, user]);

    // Debounce to avoid rapid calls on filter typing
    const debouncedFetchBookings = useMemo(() => _.debounce(fetchBookings, 250), [fetchBookings]);
    useEffect(() => { debouncedFetchBookings(); return debouncedFetchBookings.cancel; }, [debouncedFetchBookings]);

    // ────────────────────────────── Create Booking ──────────────────────────────
    const create = async (payload) => {
        setError("");
        setSaving(true);
        try {
            const res = await BookingApi.createBooking(payload);
            if (res.ok) {
                const newBooking = { ...res.booking, _id: res.booking._id || res.booking.id };
                setItems(prev => [newBooking, ...prev]);

                // Update cache: add to top of all relevant cached lists
                Object.keys(MEMO_CACHE).forEach(key => {
                    const cache = MEMO_CACHE[key];
                    if (!cache.params || !cache.params.status || cache.params.status === newBooking.status) {
                        cache.items = [newBooking, ...cache.items];
                        cache.totalItems += 1;
                    }
                });

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
        } finally { setSaving(false); }
    };

    // ────────────────────────────── Update Booking ──────────────────────────────
    const update = async (id, patch) => {
        setError("");
        setSaving(true);
        try {
            if (!patch || Object.keys(patch).length === 0) return { ok: false, error: "No changes detected" };
            const res = await BookingApi.updateBooking(id, patch);

            if (res.ok) {
                const updatedBooking = { ...res.booking, _id: res.booking?._id || res.booking?.id || id };
                setItems(prev => prev.map(b => b._id === id ? updatedBooking : b));

                // Update cache: replace or remove if status/filter mismatch
                Object.keys(MEMO_CACHE).forEach(key => {
                    const cache = MEMO_CACHE[key];
                    cache.items = cache.items
                        .map(b => b._id === id ? updatedBooking : b)
                        .filter(b => {
                            const p = cache.params;
                            if (!p) return true;
                            if (p.status && b.status !== p.status) return false;
                            if (p.services && b.services !== p.services) return false;
                            if (p.user && b.user !== p.user) return false;
                            return true;
                        });
                });

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
        } finally { setSaving(false); }
    };

    // ────────────────────────────── Update Booking Status ──────────────────────────────
    const updateStatus = async (id, newStatus) => {
        setError("");
        try {
            const res = await BookingApi.updateBookingStatus(id, newStatus);
            if (res.ok) {
                const updatedBooking = { ...res.booking, _id: res.booking._id || res.booking.id };
                setItems(prev => prev.map(b => b._id === id ? updatedBooking : b));

                // Update cache: replace or remove if status/filter mismatch
                Object.keys(MEMO_CACHE).forEach(key => {
                    const cache = MEMO_CACHE[key];
                    cache.items = cache.items
                        .map(b => b._id === id ? updatedBooking : b)
                        .filter(b => {
                            const p = cache.params;
                            if (!p) return true;
                            if (p.status && b.status !== p.status) return false;
                            if (p.services && b.services !== p.services) return false;
                            if (p.user && b.user !== p.user) return false;
                            return true;
                        });
                });

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
        }
    };

    // ────────────────────────────── Export CSV ──────────────────────────────
    const exportCSV = async () => {
        if (!activeParams) return { ok: false, error: "No filters applied" };
        return await BookingApi.exportBookings(activeParams);
    };

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
        create,
        update,
        updateStatus,
        exportCSV,
    };
}
