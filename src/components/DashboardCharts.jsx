import React, { useMemo, useState } from "react";
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
import useDashboardStats from "../hooks/useDashboardStats.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const INTERVALS = ["daily", "weekly", "monthly", "yearly"];

export default function DashboardCharts() {
    const [selectedInterval, setSelectedInterval] = useState("monthly");
    const { revenue, serviceTrends, loading, error } = useDashboardStats();

    // ---------- Revenue Chart ----------
    const revenueData = useMemo(() => {
        const data = revenue[selectedInterval] || [];
        if (!data.length) return { labels: [], datasets: [] };

        return {
            labels: data.map(d => d._id),
            datasets: [{
                label: "Revenue (£)",
                data: data.map(d => d.totalRevenue),
                borderColor: "rgba(59, 130, 246, 1)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
    }, [revenue, selectedInterval]);

    const revenueOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            tooltip: { callbacks: { label: ctx => `£${ctx.raw.toLocaleString()}` } }
        },
        scales: {
            y: { beginAtZero: true, ticks: { callback: v => `£${v}` } },
            x: { grid: { display: false } },
        }
    };

    // ---------- Service Trends ----------
    const serviceTrendsData = useMemo(() => {
        const data = serviceTrends[selectedInterval] || [];
        if (!data.length) return { labels: [], datasets: [] };

        const labels = [...new Set(data.map(d => d.period))];
        const services = [...new Set(data.map(d => d.service))];
        const colors = ["rgba(99,102,241,0.8)", "rgba(16,185,129,0.8)", "rgba(251,191,36,0.8)", "rgba(239,68,68,0.8)", "rgba(14,165,233,0.8)", "rgba(168,85,247,0.8)"];

        const mapData = {};
        labels.forEach(l => mapData[l] = {});
        data.forEach(d => mapData[d.period][d.service] = d.count);

        const datasets = services.map((s, idx) => ({
            label: s,
            data: labels.map(l => mapData[l][s] || 0),
            backgroundColor: colors[idx % colors.length],
            borderRadius: 6
        }));

        return { labels, datasets };
    }, [serviceTrends, selectedInterval]);

    const serviceTrendsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    };

    return (
        <div>
            {/* Interval Toggle */}
            <div className="flex gap-2 mb-6">
                {INTERVALS.map(i => (
                    <button
                        key={i}
                        onClick={() => setSelectedInterval(i)}
                        className={`px-4 py-2 rounded font-medium transition ${selectedInterval === i ? "bg-indigo-600 text-white shadow" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    >
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue */}
                <div className="bg-white border rounded-lg shadow p-4 h-80">
                    <h2 className="text-lg font-semibold mb-3">Revenue ({selectedInterval})</h2>
                    {loading ? <p className="text-gray-500">Loading...</p> :
                        error ? <p className="text-red-500">{error}</p> :
                            <Line data={revenueData} options={revenueOptions} />}
                </div>

                {/* Service Trends */}
                <div className="bg-white border rounded-lg shadow p-4 h-80">
                    <h2 className="text-lg font-semibold mb-3">Service Trends ({selectedInterval})</h2>
                    {loading ? <p className="text-gray-500">Loading...</p> :
                        error ? <p className="text-red-500">{error}</p> :
                            <Bar data={serviceTrendsData} options={serviceTrendsOptions} />}
                </div>
            </div>
        </div>
    );
}
