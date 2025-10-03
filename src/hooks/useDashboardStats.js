// src/hooks/useDashboardStats.js
import { useState, useEffect } from "react";
import { getDashboardCharts } from "../lib/api/statsApi.js";

export default function useDashboardStats({ enabled = true } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) return;
        (async () => {
            setLoading(true);
            try {
                const res = await getDashboardCharts();
                setData(res);
            } catch (err) {
                setError(err.message || "Failed to fetch dashboard stats");
            } finally {
                setLoading(false);
            }
        })();
    }, [enabled]);

    return { data, loading, error };
}
