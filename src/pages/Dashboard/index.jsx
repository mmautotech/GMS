// src/pages/Dashboard/index.jsx
import React, { useMemo, useState, useEffect } from "react";
import useBookings from "../../hooks/useBookings.js";
import BookingsTable from "./bookingsTable.jsx";
import StatCard from "./statCard.jsx";
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

export default function Dashboard({ user }) {
    const { list: bookings, loadingList, error, page, setPage, totalPages, totalItems } =
        useBookings({ pageSize: 20 });

    // --- Filters ---
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [date, setDate] = useState("");

    // --- Chart data ---
    const [monthlyRevenue, setMonthlyRevenue] = useState(Array(12).fill(0));
    const [serviceTrends, setServiceTrends] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const data = await getDashboardCharts();
                setMonthlyRevenue(data.monthlyRevenue || Array(12).fill(0));
                setServiceTrends(data.serviceTrends || []);
            } catch (err) {
                console.error("Failed to fetch dashboard charts:", err);
            } finally {
                setLoadingCharts(false);
            }
        };
        fetchCharts();
    }, []);

    // --- Filter bookings ---
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const searchLower = search.toLowerCase();
            const matchesSearch =
                !search ||
                b.ownerName?.toLowerCase().includes(searchLower) ||
                b.ownerNumber?.toLowerCase().includes(searchLower) ||
                b.vehicleRegNo?.toLowerCase().includes(searchLower) ||
                b.makeModel?.toLowerCase().includes(searchLower) ||
                b.ownerPostalCode?.toLowerCase().includes(searchLower);

            const matchesStatus = !status || b.status?.toLowerCase() === status.toLowerCase();

            let matchesDate = true;
            if (date) {
                const bookingDateStr = b.scheduledDate
                    ? new Date(b.scheduledDate).toISOString().split("T")[0]
                    : null;
                matchesDate = bookingDateStr === date;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [bookings, search, status, date]);

    // --- Compute stats ---
    const stats = useMemo(() => {
        return filteredBookings.reduce(
            (acc, b) => {
                const s = b.status?.toLowerCase() || "other";
                switch (s) {
                    case "completed":
                        acc.completed += 1;
                        break;
                    case "pending":
                        acc.pending += 1;
                        break;
                    case "arrived":
                        acc.arrived += 1;
                        break;
                    default:
                        acc.other += 1;
                }
                acc.total += 1;
                return acc;
            },
            { total: 0, completed: 0, pending: 0, arrived: 0, other: 0 }
        );
    }, [filteredBookings]);

    // --- Chart datasets ---
    const monthlyRevenueData = {
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
    };

    const serviceTrendsData = {
        labels: serviceTrends.map((s) => s._id),
        datasets: [
            {
                label: "Services",
                data: serviceTrends.map((s) => s.count),
                backgroundColor: "blue",
            },
        ],
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-900">
                Welcome Back{user?.username ? `, ${user.username}` : "!"}
            </h1>

            {/* StatCards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Bookings" value={stats.total} />
                <StatCard title="Completed" value={stats.completed} />
                <StatCard title="Pending" value={stats.pending} />
                <StatCard title="Arrived" value={stats.arrived} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Monthly Revenue</h2>
                    {loadingCharts ? <p>Loading...</p> : <Line data={monthlyRevenueData} />}
                </div>
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Service Trends</h2>
                    {loadingCharts ? <p>Loading...</p> : <Bar data={serviceTrendsData} />}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search by name, phone, reg no, model, postcode"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="arrived">Arrived</option>
                    <option value="completed">Completed</option>
                </select>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                />
                <button
                    onClick={() => {
                        setSearch("");
                        setStatus("");
                        setDate("");
                    }}
                    className="bg-gray-200 px-3 py-2 rounded"
                >
                    Reset
                </button>
            </div>

            {/* Bookings Table */}
            <BookingsTable bookings={filteredBookings} loading={loadingList} error={error} />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    <button
                        disabled={page <= 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 border rounded">
                        Page {page} of {totalPages} ({totalItems} bookings)
                    </span>
                    <button
                        disabled={page >= totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
