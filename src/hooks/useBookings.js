// src/hooks/useBookings.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

export default function useBookings({
    status,
    type = "booking", // 👈 NEW: "booking" | "prebooking"
    initialPage = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortDir = "desc",
    search = "",
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

    // --- Fetch bookings / prebookings ---
    const fetchBookings = useCallback(async () => {
        setLoadingList(true);
        setError("");
        try {
            const params = {
                page,
                limit: pageSize,
                sortBy,
                sortDir,
            };
            if (status) params.status = status;
            if (search) params.search = search;

            // ✅ decide which API to call
            const res =
                type === "prebooking"
                    ? await BookingApi.getPrebookings(params)
                    : await BookingApi.getBookings(params);

            if (res.ok) {
                const normalizedItems = res.items.map((b) => ({
                    ...b,
                    _id: b._id || b.id,
                }));
                setItems(normalizedItems);
                setTotalPages(res.totalPages);
                setTotalItems(res.totalItems);
                setHasNextPage(res.hasNextPage);
                setHasPrevPage(res.hasPrevPage);
            } else {
                setError(res.error || "Failed to fetch bookings");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch bookings");
        } finally {
            setLoadingList(false);
        }
    }, [status, page, pageSize, sortBy, sortDir, search, type]);

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
                const newBooking = {
                    ...res.booking,
                    _id: res.booking._id || res.booking.id,
                };
                setItems((prev) => [newBooking, ...prev]);
                return { ok: true, booking: newBooking };
            } else {
                setError(res.error);
                return { ok: false, error: res.error };
            }
        } catch (err) {
            const msg = err.message || "Failed to create booking";
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
                const updatedBooking = {
                    ...res.booking,
                    _id: res.booking._id || res.booking.id,
                };
                setItems((prev) =>
                    prev.map((b) => (b._id === id ? updatedBooking : b))
                );
                return { ok: true, booking: updatedBooking };
            } else {
                setError(res.error);
                return { ok: false, error: res.error };
            }
        } catch (err) {
            const msg = err.message || "Failed to update booking";
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
            if (!id || !newStatus)
                throw new Error("Booking ID and status are required");

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
                setError(res.error);
                return { ok: false, error: res.error };
            }
        } catch (err) {
            const msg = err.message || "Failed to update booking status";
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

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
        fetchBookings,
        refresh,
        create,
        update,
        updateStatus,
    };
}
