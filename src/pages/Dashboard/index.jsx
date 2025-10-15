// src/pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import useBookings from "../../hooks/useBookings.js";
import useUsers from "../../hooks/useUsers.js";
import useServiceOptions from "../../hooks/useServiceOptions.js";
import useDashboardStats from "../../hooks/useDashboardStats.js";

import { useSocket } from "../../context/SocketProvider.js"; // ✅ Import socket
import BookingsTable from "./bookingsTable.jsx";
import ParamsSummary from "../../components/ParamsSummary.jsx";
import StatCard from "../../components/StatCard.jsx";
import DashboardCharts from "../../components/DashboardCharts.jsx";

const ALLOWED_STATUSES = [
    { label: "PENDING", value: "pending" },
    { label: "ARRIVED", value: "arrived" },
    { label: "COMPLETED", value: "completed" },
    { label: "CANCELLED", value: "cancelled" },
];

const SORT_OPTIONS = [
    { label: "Booking Date", value: "createdDate" },
    { label: "Landing Date", value: "scheduledDate" },
    { label: "Arrival Date", value: "arrivedDate" },
    { label: "Cancellation Date", value: "cancelledDate" },
    { label: "Completion Date", value: "completedDate" },
    { label: "Registration Number", value: "vehicleRegNo" },
    { label: "Make & Model", value: "makeModel" },
    { label: "Phone Number", value: "ownerNumber" },
    { label: "Post Code", value: "ownerPostalCode" },
];

const LIMIT_OPTIONS = [5, 10, 50, 100];
const isDateField = (f) =>
    ["createdDate", "scheduledDate", "arrivedDate", "cancelledDate", "completedDate"].includes(f);

export default function Dashboard({ user }) {
    const socket = useSocket(); // ✅ Get socket instance

    const [draft, setDraft] = useState({
        search: "",
        fromDate: "",
        toDate: "",
        status: "",
        services: "",
        user: "",
        sortBy: "createdDate",
        sortDir: "desc",
        limit: 10,
    });
    const [applied, setApplied] = useState(draft);

    const onDraftSortByChange = (nextSortBy) => {
        setDraft((d) => ({
            ...d,
            sortBy: nextSortBy,
            sortDir: isDateField(nextSortBy) ? "desc" : "asc",
        }));
    };

    // ✅ Dropdown Data
    const {
        list: serviceOptions,
        loading: loadingServices,
        error: servicesError,
    } = useServiceOptions({ useSessionCache: true });

    const {
        list: userOptions,
        map: userMap,
        loading: loadingUsers,
        error: usersError,
    } = useUsers({ useSessionCache: true });

    // ✅ Booking list
    const {
        list: bookings,
        loadingList,
        error,
        totalPages,
        totalItems,
        page,
        setPage,
        hasNextPage,
        hasPrevPage,
        params,
        exportCSV,
        refresh: refreshBookings, // ✅ Assuming your hook supports manual refresh
    } = useBookings({
        pageSize: applied.limit,
        status: applied.status,
        search: applied.search,
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        services: applied.services,
        user: applied.user,
        sortBy: applied.sortBy,
        sortDir: applied.sortDir,
    });

    // ✅ Booking stats
    const {
        bookings: bookingStats,
        loading: loadingStats,
        error: statsError,
        refresh: refreshStats,
    } = useDashboardStats();

    // ✅ Listen to socket events
    useEffect(() => {
        if (!socket) return;

        // Listen for booking updates from backend
        socket.on("bookingUpdated", (data) => {
            console.log("📦 Booking updated via socket:", data);
            refreshBookings?.(); // refresh list
            refreshStats?.(); // refresh stats
        });

        socket.on("bookingCreated", (data) => {
            console.log("🆕 Booking created:", data);
            refreshBookings?.();
            refreshStats?.();
        });

        socket.on("bookingDeleted", (data) => {
            console.log("❌ Booking deleted:", data);
            refreshBookings?.();
            refreshStats?.();
        });

        return () => {
            socket.off("bookingUpdated");
            socket.off("bookingCreated");
            socket.off("bookingDeleted");
        };
    }, [socket, refreshBookings, refreshStats]);

    // ✅ Filters
    const applyFilters = () => {
        setApplied(draft);
        setPage(1);
    };

    const resetFilters = () => {
        const reset = {
            search: "",
            fromDate: "",
            toDate: "",
            status: "",
            services: "",
            user: "",
            sortBy: "createdDate",
            sortDir: "desc",
            limit: 10,
        };
        setDraft(reset);
        setApplied(reset);
        setPage(1);
    };

    return (
        <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-blue-900">
                    Welcome Back{user?.username ? `, ${user.username}` : "!"}
                </h1>
                <button
                    onClick={refreshStats}
                    disabled={loadingStats}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loadingStats ? "Refreshing..." : "Refresh Stats"}
                </button>
            </div>

            {/* Stat Cards */}
            {statsError ? (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    Failed to load booking stats: {statsError}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6">
                    <StatCard title="Total Bookings" value={bookingStats?.total || 0} loading={loadingStats} />
                    <StatCard title="Completed" value={bookingStats?.completed || 0} loading={loadingStats} />
                    <StatCard title="Pending" value={bookingStats?.pending || 0} loading={loadingStats} />
                    <StatCard title="Arrived" value={bookingStats?.arrived || 0} loading={loadingStats} />
                    <StatCard title="Cancelled" value={bookingStats?.cancelled || 0} loading={loadingStats} />
                </div>
            )}

            {/* Charts */}
            <div className="mb-6">
                <DashboardCharts />
            </div>

            {/* ✅ Filters */}
            <div className="mb-3 space-y-3">
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
                        value={draft.status}
                        onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">All Status</option>
                        {ALLOWED_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={draft.services}
                        onChange={(e) => setDraft((d) => ({ ...d, services: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        disabled={loadingServices}
                    >
                        <option value="">{loadingServices ? "Loading..." : "All Services"}</option>
                        {servicesError ? (
                            <option disabled value="">
                                Failed to load services
                            </option>
                        ) : (
                            serviceOptions.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">
                        <select
                            value={draft.user}
                            onChange={(e) => setDraft((d) => ({ ...d, user: e.target.value }))}
                            className="border rounded px-3 py-2 w-full"
                            disabled={loadingUsers}
                        >
                            <option value="">{loadingUsers ? "Loading users..." : "All Users"}</option>
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
                        <select
                            value={draft.sortBy}
                            onChange={(e) => onDraftSortByChange(e.target.value)}
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
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>
            {params && (
                <ParamsSummary
                    params={params}
                    serviceMap={serviceOptions.reduce((acc, s) => {
                        acc[s.value] = s.label;
                        return acc;
                    }, {})}
                    userMap={userMap}
                />
            )}

            <BookingsTable bookings={bookings} loading={loadingList} error={error} />

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">Total Bookings: {totalItems}</p>
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
        </div>
    );
}