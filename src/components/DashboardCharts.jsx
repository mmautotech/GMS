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

// Helper: ISO week string
function getISOWeekString(d) {
    const date = new Date(d);
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target - firstThursday;
    const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
    return `${target.getFullYear()}-W${week.toString().padStart(2, "0")}`;
}

export default function DashboardCharts() {
    const [selectedInterval, setSelectedInterval] = useState("monthly");
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

        let labels = [];
        let values = [];

        if (selectedInterval === "daily") {
            labels = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split("T")[0];
            });
            const mapData = data.reduce((acc, r) => {
                acc[r._id] = r.totalRevenue || 0;
                return acc;
            }, {});
            values = labels.map((l) => mapData[l] || 0);
        } else if (selectedInterval === "weekly") {
            labels = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 7 * (11 - i));
                return getISOWeekString(d);
            });
            const mapData = data.reduce((acc, r) => {
                const weekLabel = `${r._id.year}-W${r._id.isoWeek.toString().padStart(2, "0")}`;
                acc[weekLabel] = r.totalRevenue || 0;
                return acc;
            }, {});
            values = labels.map((l) => mapData[l] || 0);
        } else {
            labels = data.map((r) => r._id || r);
            values = data.map((r) => r.totalRevenue || r);
        }

        return {
            labels,
            datasets: [
                {
                    label: "Revenue (£)",
                    data: values,
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
            legend: { position: "top", labels: { font: { size: 14 } } },
            tooltip: {
                callbacks: {
                    label: (context) => `£${context.raw.toLocaleString()}`,
                },
            },
        },
        scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => `£${v}` }, grid: { color: "rgba(0,0,0,0.05)" } },
            x: { grid: { color: "rgba(0,0,0,0.05)" } },
        },
    };

    // ---------- Service Trends Chart ----------
    const serviceTrendsData = useMemo(() => {
        const data = serviceTrends[selectedInterval] || [];
        if (!data.length) return { labels: [], datasets: [] };

        let labels = [];
        if (selectedInterval === "daily") {
            labels = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split("T")[0];
            });
        } else if (selectedInterval === "weekly") {
            labels = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 7 * (11 - i));
                return getISOWeekString(d);
            });
        } else if (selectedInterval === "monthly") {
            labels = Array.from({ length: 12 }, (_, i) => {
                const m = new Date();
                m.setMonth(i);
                return `${m.getFullYear()}-${(m.getMonth() + 1).toString().padStart(2, "0")}`;
            });
        } else if (selectedInterval === "yearly") {
            labels = [...new Set(data.map((d) => d.period || d._id))].sort();
        }

        const mapData = {};
        labels.forEach((label) => (mapData[label] = {}));
        data.forEach((item) => {
            const period = item.period || item._id || "";
            if (!mapData[period]) mapData[period] = {};
            mapData[period][item.service] = item.count;
        });

        const allServices = [...new Set(data.map((d) => d.service))];
        const colors = [
            "rgba(99, 102, 241, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(14, 165, 233, 0.8)",
            "rgba(168, 85, 247, 0.8)",
        ];

        const datasets = allServices.map((service, idx) => ({
            label: service,
            data: labels.map((l) => mapData[l][service] || 0),
            backgroundColor: colors[idx % colors.length],
            borderRadius: 6,
            barThickness: 24,
        }));

        return { labels, datasets };
    }, [serviceTrends, selectedInterval]);

    const serviceTrendsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top", labels: { font: { size: 14 } } },
            tooltip: { mode: "index", intersect: false },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
            x: { grid: { color: "rgba(0,0,0,0.05)" } },
        },
    };

    return (
        <div className="space-y-6">
            {/* Interval Toggle */}
            <div className="flex gap-3 mb-4">
                {INTERVALS.map((i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedInterval(i)}
                        className={`px-4 py-2 rounded font-medium transition duration-200 ${selectedInterval === i
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                    </button>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white border rounded-lg shadow p-5 h-96 flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Revenue ({selectedInterval})</h3>
                    {loading ? (
                        <p className="text-gray-500 text-center mt-auto">Loading...</p>
                    ) : (
                        <Line data={revenueData} options={revenueOptions} className="flex-1" />
                    )}
                </div>

                {/* Service Trends Chart */}
                <div className="bg-white border rounded-lg shadow p-5 h-96 flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Service Trends ({selectedInterval})</h3>
                    {loading ? (
                        <p className="text-gray-500 text-center mt-auto">Loading...</p>
                    ) : (
                        <Bar data={serviceTrendsData} options={serviceTrendsOptions} className="flex-1" />
                    )}
                </div>
            </div>
        </div>
    );
}
