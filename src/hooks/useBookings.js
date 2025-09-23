// src/hooks/useBookings.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

export default function useBookings({
    status,
    fromDate,
    toDate,
    search = "",
    services,
    type = "booking",
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

    // --- Fetch bookings ---
    const fetchBookings = useCallback(async () => {
        setLoadingList(true);
        setError("");
        try {
            const res = await BookingApi.getBookings({
                page,
                limit: pageSize,
                sortBy,
                sortDir,
                type,
                status,
                fromDate,
                toDate,
                search,
                services,
            });

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
            } else {
                setError(res.error || "Failed to fetch bookings");
            }
        } catch (err) {
            setError(err?.message || "Failed to fetch bookings");
        } finally {
            setLoadingList(false);
        }
    }, [
        page,
        pageSize,
        sortBy,
        sortDir,
        type,
        status,
        fromDate,
        toDate,
        search,
        services,
    ]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // --- Create booking ---
    const create = async (payload) => {
        setError("");
        setSaving(true);
        try {
            const res = await BookingApi.createBooking(payload);
            if (res.ok) {
                const newBooking = { ...res.booking, _id: res.booking._id || res.booking.id };
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
            const res = await BookingApi.updateBooking(id, patch);
            if (res.ok) {
                const updatedBooking = { ...res.booking, _id: res.booking._id || res.booking.id };
                setItems((prev) => prev.map((b) => (b._id === id ? updatedBooking : b)));
                return { ok: true, booking: updatedBooking };
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
                const updatedBooking = { ...res.booking, _id: res.booking._id || res.booking.id };
                setItems((prev) => prev.map((b) => (b._id === id ? updatedBooking : b)));
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

    const refresh = () => fetchBookings();

    return {
        // data
        items,
        list: useMemo(() => items, [items]),
        setList: setItems,

        // status
        loadingList,
        saving,
        error,
        setError,

        // paging
        page,
        setPage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        pageSize,

        // server-echoed params & meta
        params: activeParams,
        meta,

        // actions
        fetchBookings,
        refresh,
        create,
        update,
        updateStatus,
        exportCSV, // 👈 new action
    };
}
