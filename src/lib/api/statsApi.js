// src/lib/api/statsApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * ✅ Fetch dashboard stats
 * Response shape: { revenue: { daily: [], weekly: [], monthly: [], yearly: [] }, serviceTrends, bookings }
 */
export async function getDashboardCharts() {
    try {
        const { data } = await axiosInstance.get("/dashboard/stats");

        // Normalize revenue: make sure each interval exists
        const revenue = {
            daily: data.revenue?.daily || [],
            weekly: data.revenue?.weekly || [],
            monthly: data.revenue?.monthly || [],
            yearly: data.revenue?.yearly || [],
        };

        // Normalize serviceTrends
        const serviceTrends = {
            daily: data.serviceTrends?.daily || [],
            weekly: data.serviceTrends?.weekly || [],
            monthly: data.serviceTrends?.monthly || [],
            yearly: data.serviceTrends?.yearly || [],
        };

        // Normalize bookings
        const bookings = {
            total: data.bookings?.total || 0,
            pending: data.bookings?.pending || 0,
            arrived: data.bookings?.arrived || 0,
            completed: data.bookings?.completed || 0,
            cancelled: data.bookings?.cancelled || 0,
        };

        return {
            success: true,
            revenue,
            serviceTrends,
            bookings,
        };
    } catch (err) {
        console.error("❌ Failed to fetch dashboard chart data:", err);

        return {
            success: false,
            revenue: { daily: [], weekly: [], monthly: [], yearly: [] },
            serviceTrends: { daily: [], weekly: [], monthly: [], yearly: [] },
            bookings: { total: 0, pending: 0, arrived: 0, completed: 0, cancelled: 0 },
            error: err.response?.data?.message || err.message,
        };
    }
}
