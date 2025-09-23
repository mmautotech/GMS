// src/pages/Dashboard/Dashboard.jsx
import React, { useMemo, useState } from "react";
import useBookings from "../../hooks/useBookings.js";
import useServices from "../../hooks/useServices.js";
import BookingsTable from "./bookingsTable.jsx";
import StatCard from "../../components/StatCard.jsx";
import ParamsSummary from "../../components/ParamsSummary.jsx";

import { Line, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { getDashboardCharts } from "../../lib/api/statsApi.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// status values must be lowercase to match backend validator
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

const LIMIT_OPTIONS = [5, 25, 50, 100];
const isDateField = (f) =>
    ["createdDate", "scheduledDate", "arrivedDate", "cancelledDate", "completedDate"].includes(f);

export default function Dashboard({ user }) {
    // ---------- DRAFT FILTERS ----------
    const [draft, setDraft] = useState({
        search: "",
        fromDate: "",
        toDate: "",
        status: "",
        services: "",
        sortBy: "createdDate",
        sortDir: "desc", // default for date fields
        limit: 25,
    });

    // Auto-adjust sortDir when sortBy changes
    const onDraftSortByChange = (nextSortBy) => {
        setDraft((d) => ({
            ...d,
            sortBy: nextSortBy,
            sortDir: isDateField(nextSortBy) ? "desc" : "asc",
        }));
    };

    // ---------- APPLIED FILTERS ----------
    const [applied, setApplied] = useState(draft);

    // Services (cached list + id→name map)
    const {
        list: serviceOptions,
        map: serviceMap,
        loading: loadingServices,
        error: servicesError,
    } = useServices({ enabled: true, useSessionCache: true });

    // Bookings hook — ONLY reacts to applied values
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
        exportCSV,   // 👈 add this
    } = useBookings({
        pageSize: applied.limit,
        status: applied.status,
        search: applied.search,
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        services: applied.services,
        sortBy: applied.sortBy,
        sortDir: applied.sortDir,
    });


    // ---------- APPLY & RESET ----------
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
            sortBy: "createdDate",
            sortDir: "desc",
            limit: 25,
        };
        setDraft(reset);
        setApplied(reset);
        setPage(1);
    };

    // ---------- Charts ----------
    const [monthlyRevenue, setMonthlyRevenue] = useState(Array(12).fill(0));
    const [serviceTrends, setServiceTrends] = useState([]);
    const [bookingStats, setBookingStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        arrived: 0,
        cancelled: 0,
    });
    const [loadingCharts, setLoadingCharts] = useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const data = await getDashboardCharts();
                setMonthlyRevenue(data.monthlyRevenue || Array(12).fill(0));
                setServiceTrends(data.serviceTrends || []);
                setBookingStats(data.bookings || {});
            } catch (err) {
                console.error("Failed to fetch dashboard charts:", err);
            } finally {
                setLoadingCharts(false);
            }
        })();
    }, []);

    const monthlyRevenueData = useMemo(
        () => ({
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "Revenue",
                    data: monthlyRevenue,
                    borderColor: "blue",
                    backgroundColor: "rgba(0,0,255,0.1)",
                    tension: 0.3,
                },
            ],
        }),
        [monthlyRevenue]
    );

    const serviceTrendsData = useMemo(
        () => ({
            labels: serviceTrends.map((s) => s._id),
            datasets: [
                {
                    label: "Services",
                    data: serviceTrends.map((s) => s.count),
                    backgroundColor: "blue",
                },
            ],
        }),
        [serviceTrends]
    );

    return (
        <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
            <h1 className="text-2xl font-bold mb-4 text-blue-900">
                Welcome Back{user?.username ? `, ${user.username}` : "!"}
            </h1>

            {/* StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6">
                <StatCard title="Total Bookings" value={bookingStats.total || 0} />
                <StatCard title="Completed" value={bookingStats.completed || 0} />
                <StatCard title="Pending" value={bookingStats.pending || 0} />
                <StatCard title="Arrived" value={bookingStats.arrived || 0} />
                <StatCard title="Cancelled" value={bookingStats.cancelled || 0} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="border p-4 rounded h-64">
                    <h2 className="font-semibold mb-2">Monthly Revenue</h2>
                    {loadingCharts ? (
                        <p>Loading...</p>
                    ) : (
                        <Line data={monthlyRevenueData} options={{ responsive: true, maintainAspectRatio: false }} />
                    )}
                </div>
                <div className="border p-4 rounded h-64">
                    <h2 className="font-semibold mb-2">Service Trends</h2>
                    {loadingCharts ? (
                        <p>Loading...</p>
                    ) : (
                        <Bar data={serviceTrendsData} options={{ responsive: true, maintainAspectRatio: false }} />
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-3 space-y-3">
                {/* Row 1 */}
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
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Sorting Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">
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

                    {/* Action Buttons - always on right side */}
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

            {/* Echo of applied params */}
            {params && <ParamsSummary params={params} serviceMap={serviceMap} />}

            {/* Bookings Table */}
            <BookingsTable bookings={bookings} loading={loadingList} error={error} />

            {/* Pagination Footer */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">Total Bookings: {totalItems}</p>
                <div className="flex items-center gap-4">
                    <button
                        disabled={!hasPrevPage}
                        onClick={() => hasPrevPage && setPage(page - 1)}
                        className={`px-3 py-1 rounded ${hasPrevPage ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                        className={`px-3 py-1 rounded ${hasNextPage ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
