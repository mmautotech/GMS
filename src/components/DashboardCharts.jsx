// src/components/DashboardCharts.jsx
import React, { useEffect, useState, useMemo } from "react";
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
import { getDashboardCharts } from "../lib/api/statsApi.js";

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

const INTERVALS = ["daily", "weekly", "monthly", "yearly"];

export default function DashboardCharts() {
    const [selectedInterval, setSelectedInterval] = useState("monthly");
    const [serviceMode, setServiceMode] = useState("snapshot"); // 🔹 NEW toggle
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState({});
    const [serviceTrends, setServiceTrends] = useState({});

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getDashboardCharts();
                setRevenue(data.revenue || {});
                setServiceTrends(data.serviceTrends || {});
            } catch (err) {
                console.error("Failed to fetch dashboard charts:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ---------- Revenue Chart ----------
    const revenueData = useMemo(() => {
        const data = revenue[selectedInterval] || [];
        if (!data.length) return { labels: [], datasets: [] };

        if (selectedInterval === "monthly" && Array.isArray(data)) {
            return {
                labels: Array.from({ length: 12 }, (_, i) =>
                    `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`
                ),
                datasets: [
                    {
                        label: "Revenue (£)",
                        data: data,
                        fill: true,
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ],
            };
        }

        return {
            labels: data.map((d) => d._id || d.period),
            datasets: [
                {
                    label: "Revenue (£)",
                    data: data.map((d) => d.totalRevenue || 0),
                    fill: true,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderColor: "rgba(59, 130, 246, 1)",
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        };
    }, [revenue, selectedInterval]);

    const revenueOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            tooltip: {
                callbacks: { label: (ctx) => `£${ctx.raw.toLocaleString()}` },
            },
        },
        scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => `£${v}` } },
            x: { grid: { display: false } },
        },
    };

    // ---------- Service Trends Chart ----------
    const serviceTrendsData = useMemo(() => {
        if (serviceMode === "snapshot") {
            // ✅ Snapshot mode: aggregate counts per service
            const data = serviceTrends[selectedInterval] || [];
            if (!data.length) return { labels: [], datasets: [] };

            const serviceCounts = {};
            data.forEach((item) => {
                serviceCounts[item.service] =
                    (serviceCounts[item.service] || 0) + item.count;
            });

            return {
                labels: Object.keys(serviceCounts),
                datasets: [
                    {
                        label: "Count",
                        data: Object.values(serviceCounts),
                        backgroundColor: "rgba(59, 130, 246, 0.9)",
                        borderRadius: 6,
                        barThickness: 40,
                    },
                ],
            };
        } else {
            // ✅ Interval mode (your existing grouped dataset view)
            const data = serviceTrends[selectedInterval] || [];
            if (!data.length) return { labels: [], datasets: [] };

            const labels = [...new Set(data.map((d) => d.period))];
            const allServices = [...new Set(data.map((d) => d.service))];
            const colors = [
                "rgba(99, 102, 241, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(251, 191, 36, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(14, 165, 233, 0.8)",
                "rgba(168, 85, 247, 0.8)",
            ];

            const mapData = {};
            labels.forEach((label) => (mapData[label] = {}));
            data.forEach((item) => {
                if (!mapData[item.period]) mapData[item.period] = {};
                mapData[item.period][item.service] = item.count;
            });

            const datasets = allServices.map((service, idx) => ({
                label: service,
                data: labels.map((l) => mapData[l][service] || 0),
                backgroundColor: colors[idx % colors.length],
                borderRadius: 6,
                barThickness: 20,
            }));

            return { labels, datasets };
        }
    }, [serviceTrends, selectedInterval, serviceMode]);

    const serviceTrendsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: serviceMode === "snapshot" ? "none" : "top" },
            tooltip: { mode: "index", intersect: false },
        },
        scales: {
            y: { beginAtZero: true },
            x: { grid: { display: false } },
        },
    };

    return (
        <div>
            {/* Interval Toggle */}
            <div className="flex gap-2 mb-6">
                {INTERVALS.map((i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedInterval(i)}
                        className={`px-4 py-2 rounded font-medium transition ${selectedInterval === i
                                ? "bg-indigo-600 text-white shadow"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue */}
                <div className="bg-white border rounded-lg shadow p-4 h-80">
                    <h2 className="text-lg font-semibold mb-3">
                        Revenue ({selectedInterval})
                    </h2>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : (
                        <Line data={revenueData} options={revenueOptions} />
                    )}
                </div>

                {/* Service Trends */}
                <div className="bg-white border rounded-lg shadow p-4 h-80">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Service Trends</h2>
                        <div className="space-x-2">
                            <button
                                onClick={() => setServiceMode("snapshot")}
                                className={`px-3 py-1 rounded ${serviceMode === "snapshot"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                Snapshot
                            </button>
                            <button
                                onClick={() => setServiceMode("interval")}
                                className={`px-3 py-1 rounded ${serviceMode === "interval"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                Interval
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : (
                        <Bar data={serviceTrendsData} options={serviceTrendsOptions} />
                    )}
                </div>
            </div>
        </div>
    );
}
