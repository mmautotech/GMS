// src/hooks/useDashboardStats.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardCharts } from "../lib/api/statsApi.js";

// In-memory cache
const MEMO_CACHE = { data: null, at: 0 };
const DEFAULT_TTL = 300000; // 5 minutes

export default function useDashboardStats({ enabled = true, refreshInterval = DEFAULT_TTL } = {}) {
    const [revenue, setRevenue] = useState({});
    const [serviceTrends, setServiceTrends] = useState({});
    const [bookings, setBookings] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

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

            if (res && (res.revenue || res.serviceTrends || res.bookings)) {
                setRevenue(res.revenue || {});
                setServiceTrends(res.serviceTrends || {});
                setBookings(res.bookings || {});

                // Cache the response
                MEMO_CACHE.data = {
                    revenue: res.revenue || {},
                    serviceTrends: res.serviceTrends || {},
                    bookings: res.bookings || {},
                };
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

    // Auto-fetch on mount + when enabled changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Optional auto-refresh based on refreshInterval
    useEffect(() => {
        if (!enabled || !refreshInterval) return;
        const id = setInterval(fetchStats, refreshInterval);
        return () => clearInterval(id);
    }, [enabled, refreshInterval, fetchStats]);

    // Manual refresh
    const refresh = useCallback(() => {
        MEMO_CACHE.at = 0; // invalidate cache
        fetchStats();
    }, [fetchStats]);

    return {
        revenue,
        serviceTrends,
        bookings,
        loading,
        error,
        refresh, // manual reload
    };
}
