// src/pages/CarIn/index.jsx
import React, { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";

import { useArrivedBookings } from "../../hooks/useBookingsList.js";
import useBookings from "../../hooks/useBookings.js";
import useServices from "../../hooks/useServices.js";
import useUsers from "../../hooks/useUsers.js";

import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import BookingsTable from "./BookingsTable.jsx";
import BookingDetailModal from "./BookingDetailModal.jsx";
import UpsellModal from "./UpsellModal.jsx";

// dropdown configs
const SORT_OPTIONS = [
    { label: "Booking Date", value: "createdDate" },
    { label: "Arrival Date", value: "arrivedDate" },
    { label: "Registration No", value: "vehicleRegNo" },
    { label: "Make & Model", value: "makeModel" },
    { label: "Phone Number", value: "ownerNumber" },
    { label: "Post Code", value: "ownerPostalCode" },
];
const LIMIT_OPTIONS = [5, 25, 50, 100];

export default function CarInPage() {
    const bookingDetailRef = useRef(null);

    const [loadingCarOutId, setLoadingCarOutId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // "booking" | "upsell" | null

    // filters
    const [draft, setDraft] = useState({
        search: "",
        fromDate: "",
        toDate: "",
        services: "",
        user: "",
        sortBy: "arrivedDate",
        sortDir: "desc",
        limit: 25,
    });
    const [applied, setApplied] = useState(draft);

    const arrivedParams = useMemo(() => applied, [applied]);

    // bookings (arrived only)
    const {
        items: bookings,
        loadingList,
        error,
        page,
        setPage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        refresh,
        setList: setBookings,
        params: backendParams,
    } = useArrivedBookings(arrivedParams);

    // status update hook
    const { setError, updateStatus } = useBookings();

    // services
    const {
        list: serviceOptions,
        map: serviceMap,
        loading: loadingServices,
        error: servicesError,
    } = useServices({ enabled: true });

    // users
    const {
        list: userOptions,
        map: userMap,
        loading: loadingUsers,
        error: usersError,
    } = useUsers({ useSessionCache: true });

    // --- Actions ---

    // --- Handle Car Out ---
    const handleCarOut = useCallback(
        async (booking) => {
            if (!window.confirm("Are you sure you want to mark this car as COMPLETED (Car Out)?")) {
                return;
            }

            setLoadingCarOutId(booking._id);
            try {
                const res = await updateStatus(booking._id, "completed");

                if (res.ok) {
                    toast.success(res.message || "Car checked out successfully!");
                    await refresh(); // 👈 always reload fresh list
                } else {
                    toast.error(res.error || "Failed to check out car");
                }
            } catch (err) {
                const backendMessage =
                    err?.response?.data?.message || err.message || "Failed to check out car";
                setError(backendMessage);
                toast.error(backendMessage);
            } finally {
                setLoadingCarOutId(null);
            }
        },
        [updateStatus, refresh, setError]
    );

    const handleCancelled = useCallback(
        async (id) => {
            if (!window.confirm("Are you sure you want to CANCEL this booking?")) {
                return;
            }

            try {
                const res = await updateStatus(id, "cancelled");

                if (res.ok) {
                    toast.success(res.message || "Booking cancelled successfully!");
                    await refresh(); // always reload list
                } else {
                    toast.error(res.error || "Failed to cancel booking");
                }
            } catch (err) {
                const backendMessage =
                    err?.response?.data?.message || err.message || "Failed to cancel booking";
                setError(backendMessage);
                toast.error(backendMessage);
            }
        },
        [updateStatus, refresh, setError]
    );


    const handleSelectBooking = (booking) => {
        setSelectedBooking(booking);
        setActiveModal("booking");
    };

    const handleAddUpsell = () => {
        setActiveModal("upsell");
    };

    const handleUpsellClose = async () => {
        setActiveModal("booking");
        if (bookingDetailRef.current?.refreshUpsells) {
            bookingDetailRef.current.refreshUpsells();
        }
    };

    // filters apply & reset
    const applyFilters = () => {
        setApplied(draft);
        setPage(1);
    };
    const resetFilters = () => {
        const fresh = {
            search: "",
            fromDate: "",
            toDate: "",
            services: "",
            user: "",
            sortBy: "arrivedDate",
            sortDir: "desc",
            limit: 25,
        };
        setDraft(fresh);
        setApplied(fresh);
        setPage(1);
    };

    const params = useMemo(() => {
        return backendParams
            ? { ...backendParams, perPage: backendParams.perPage ?? backendParams.limit, page }
            : { ...arrivedParams, perPage: arrivedParams.limit, page };
    }, [backendParams, arrivedParams, page]);

    return (
        <div className="p-6 relative min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-blue-900 mb-6">Car-In (Arrived)</h1>

            {/* Filters */}
            <div className="mb-3 space-y-3 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={draft.search}
                        onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                    />
                    <input
                        type="date"
                        value={draft.fromDate}
                        onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                    />
                    <input
                        type="date"
                        value={draft.toDate}
                        onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                    />
                    <select
                        value={draft.services}
                        onChange={(e) => setDraft((d) => ({ ...d, services: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        disabled={loadingServices}
                    >
                        <option value="">
                            {loadingServices ? "Loading..." : "All Services"}
                        </option>
                        {servicesError ? (
                            <option disabled value="">
                                Failed to load services
                            </option>
                        ) : (
                            serviceOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))
                        )}
                    </select>
                    <select
                        value={draft.user}
                        onChange={(e) => setDraft((d) => ({ ...d, user: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        disabled={loadingUsers}
                    >
                        <option value="">
                            {loadingUsers ? "Loading..." : "All Users"}
                        </option>
                        {usersError ? (
                            <option disabled value="">
                                Failed to load users
                            </option>
                        ) : (
                            userOptions.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.username}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        <select
                            value={draft.sortBy}
                            onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value }))}
                            className="border rounded px-3 py-2 w-full"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={draft.sortDir}
                            onChange={(e) => setDraft((d) => ({ ...d, sortDir: e.target.value }))}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                        <select
                            value={draft.limit}
                            onChange={(e) => setDraft((d) => ({ ...d, limit: Number(e.target.value) }))}
                            className="border rounded px-3 py-2 w-full"
                        >
                            {LIMIT_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 md:ml-4">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Params Summary */}
            <ParamsSummary params={params} serviceMap={serviceMap} userMap={userMap} />

            {/* Table */}
            {loadingList ? (
                <InlineSpinner label="Loading arrived bookings…" />
            ) : (
                <BookingsTable
                    bookings={bookings}
                    onCarOut={handleCarOut}
                    onCancelled={handleCancelled}
                    onSelectBooking={handleSelectBooking}
                    loadingCarOutId={loadingCarOutId}
                />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">Total Arrived: {totalItems}</p>
                <div className="flex items-center gap-4">
                    <button
                        disabled={!hasPrevPage}
                        onClick={() => hasPrevPage && setPage(page - 1)}
                        className={`px-3 py-1 rounded ${hasPrevPage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Prev
                    </button>
                    <span className="text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={!hasNextPage}
                        onClick={() => hasNextPage && setPage(page + 1)}
                        className={`px-3 py-1 rounded ${hasNextPage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Modals */}
            {activeModal === "booking" && selectedBooking && (
                <BookingDetailModal
                    ref={bookingDetailRef}
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    onAddUpsell={handleAddUpsell}
                />
            )}

            {activeModal === "upsell" && selectedBooking && (
                <UpsellModal
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={handleUpsellClose}
                />
            )}
        </div>
    );
}
