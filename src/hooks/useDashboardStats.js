// src/hooks/useDashboardStats.js
import { useState, useEffect, useCallback } from "react";
import { getDashboardCharts } from "../lib/api/statsApi.js";

export default function useDashboardStats({ enabled = true, refreshInterval = 300000 } = {}) {
    const [revenue, setRevenue] = useState({});
    const [serviceTrends, setServiceTrends] = useState({});
    const [bookings, setBookings] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ Fetch function
    const fetchStats = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getDashboardCharts();

            // Backend returns { revenue, serviceTrends, bookings }
            if (res && (res.revenue || res.serviceTrends || res.bookings)) {
                setRevenue(res.revenue || {});
                setServiceTrends(res.serviceTrends || {});
                setBookings(res.bookings || {});
            } else {
                setError("Invalid dashboard response");
            }
        } catch (err) {
            console.error("❌ useDashboardStats error:", err);
            setError(err.message || "Failed to fetch dashboard stats");
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    // ✅ Auto-fetch on mount + when enabled changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // ✅ Optional auto-refresh (defaults to 5 minutes)
    useEffect(() => {
        if (!enabled || !refreshInterval) return;
        const id = setInterval(fetchStats, refreshInterval);
        return () => clearInterval(id);
    }, [enabled, refreshInterval, fetchStats]);

    return {
        revenue,       // { daily, weekly, monthly, yearly }
        serviceTrends, // { daily, weekly, monthly, yearly }
        bookings,      // { total, completed, pending, arrived, cancelled }
        loading,
        error,
        refresh: fetchStats, // manual reload
    };
}
