import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardCharts } from "../lib/api/statsApi.js";

// In-memory cache
const MEMO_CACHE = { data: null, at: 0 };
const DEFAULT_TTL = 300000; // 5 minutes

export default function useDashboardStats({ enabled = true, refreshInterval = DEFAULT_TTL } = {}) {
    const [revenue, setRevenue] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        yearly: [],
    });
    const [serviceTrends, setServiceTrends] = useState({});
    const [bookings, setBookings] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false }, []);

    const fetchStats = useCallback(async () => {
        if (!enabled) return;

        // Serve from cache if within TTL
        if (MEMO_CACHE.data && Date.now() - MEMO_CACHE.at < DEFAULT_TTL) {
            const cached = MEMO_CACHE.data;
            setRevenue(cached.revenue || {});
            setServiceTrends(cached.serviceTrends || {});
            setBookings(cached.bookings || {});
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await getDashboardCharts();
            if (!mounted.current) return;

            if (res && res.revenue) {
                // Transform revenue for ChartJS
                const chartRevenue = {
                    daily: res.revenue.daily.map(d => ({ _id: d.time, totalRevenue: d.totalRevenue })),
                    weekly: res.revenue.weekly.map(d => ({ _id: d._id, totalRevenue: d.totalRevenue })),
                    monthly: res.revenue.monthly.map(d => ({ _id: d._id, totalRevenue: d.totalRevenue })),
                    yearly: res.revenue.yearly.map(d => ({ _id: d._id, totalRevenue: d.totalRevenue })),
                };

                setRevenue(chartRevenue);
                setServiceTrends(res.serviceTrends || {});
                setBookings(res.bookings || {});

                // Cache response
                MEMO_CACHE.data = { revenue: chartRevenue, serviceTrends: res.serviceTrends || {}, bookings: res.bookings || {} };
                MEMO_CACHE.at = Date.now();
            } else {
                setError("Invalid dashboard response");
            }
        } catch (err) {
            if (!mounted.current) return;
            console.error("❌ useDashboardStats error:", err);
            setError(err.message || "Failed to fetch dashboard stats");
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => {
        if (enabled && refreshInterval) {
            const id = setInterval(fetchStats, refreshInterval);
            return () => clearInterval(id);
        }
    }, [enabled, refreshInterval, fetchStats]);

    const refresh = useCallback(() => { MEMO_CACHE.at = 0; fetchStats(); }, [fetchStats]);

    return { revenue, serviceTrends, bookings, loading, error, refresh };
}
