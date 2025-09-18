// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import useBookings from "../../hooks/useBookings.js";
import BookingsTable from "./bookingsTable.jsx";
import StatCard from "./StatCard.jsx";
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
import Pagination from "../../components/Pagination.jsx";

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

const ALLOWED_STATUSES = ["pending", "arrived", "completed", "cancelled"];

export default function Dashboard({ user }) {
    const pageSize = 20;
    const [status, setStatus] = useState("");
    const [date, setDate] = useState("");

    // Multi-field search states
    const [searchName, setSearchName] = useState("");
    const [searchRegNo, setSearchRegNo] = useState("");
    const [searchModel, setSearchModel] = useState("");
    const [searchPostcode, setSearchPostcode] = useState("");

    const {
        list: bookings,
        loadingList,
        error,
        totalPages,
        page,
        setPage,
        fetchBookings,
    } = useBookings({
        pageSize,
        status,
        ownerName: searchName,
        vehicleRegNo: searchRegNo,
        makeModel: searchModel,
        ownerPostalCode: searchPostcode,
    });

    // --- Chart states ---
    const [monthlyRevenue, setMonthlyRevenue] = useState(Array(12).fill(0));
    const [serviceTrends, setServiceTrends] = useState([]);
    const [bookingStats, setBookingStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        arrived: 0,
    });
    const [loadingCharts, setLoadingCharts] = useState(true);

    // --- Fetch charts & booking stats ---
    useEffect(() => {
        const fetchCharts = async () => {
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
        };
        fetchCharts();
    }, []);

    // --- Refetch bookings when filters/page change ---
    useEffect(() => {
        fetchBookings();
    }, [status, searchName, searchRegNo, searchModel, searchPostcode, page, fetchBookings]);

    // --- Filter by date locally ---
    const filteredByDate = bookings.filter((b) =>
        date
            ? b.scheduledDate &&
            new Date(b.scheduledDate).toISOString().split("T")[0] === date
            : true
    );

    // --- Chart data ---
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

    const monthlyRevenueOptions = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: true, text: "Monthly Revenue" } },
        scales: { y: { beginAtZero: true, suggestedMax: 40000 } },
    };

    const serviceTrendsOptions = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: true, text: "Service Trends" } },
        scales: { y: { beginAtZero: true, suggestedMax: 50 } },
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-900">
                Welcome Back{user?.username ? `, ${user.username}` : "!"}
            </h1>

            {/* StatCards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Bookings" value={bookingStats.total || 0} />
                <StatCard title="Completed" value={bookingStats.completed || 0} />
                <StatCard title="Pending" value={bookingStats.pending || 0} />
                <StatCard title="Arrived" value={bookingStats.arrived || 0} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Monthly Revenue</h2>
                    {loadingCharts ? <p>Loading...</p> : <Line data={monthlyRevenueData} options={monthlyRevenueOptions} />}
                </div>
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Service Trends</h2>
                    {loadingCharts ? <p>Loading...</p> : <Bar data={serviceTrendsData} options={serviceTrendsOptions} />}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                    type="text"
                    placeholder="Owner Name"
                    value={searchName}
                    onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
                    className="border rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Vehicle Reg No"
                    value={searchRegNo}
                    onChange={(e) => { setSearchRegNo(e.target.value); setPage(1); }}
                    className="border rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Make / Model"
                    value={searchModel}
                    onChange={(e) => { setSearchModel(e.target.value); setPage(1); }}
                    className="border rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Postal Code"
                    value={searchPostcode}
                    onChange={(e) => { setSearchPostcode(e.target.value); setPage(1); }}
                    className="border rounded px-3 py-2 w-full"
                />
                <select
                    value={status}
                    onChange={(e) => {
                        const val = e.target.value;
                        setStatus(ALLOWED_STATUSES.includes(val) ? val : "");
                        setPage(1);
                    }}
                    className="border rounded px-3 py-2 w-full"
                >
                    <option value="">All Status</option>
                    {ALLOWED_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Date filter & Reset */}
            <div className="mb-6 flex gap-4">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setPage(1); }}
                    className="border rounded px-3 py-2"
                />
                <button
                    onClick={() => {
                        setSearchName(""); setSearchRegNo(""); setSearchModel(""); setSearchPostcode("");
                        setStatus(""); setDate(""); setPage(1);
                    }}
                    className="bg-gray-200 px-3 py-2 rounded"
                >
                    Reset
                </button>
            </div>

            {/* Bookings Table */}
            <BookingsTable bookings={filteredByDate} loading={loadingList} error={error} />

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
                onPageChange={setPage}
            />
        </div>
    );
}
