// src/lib/api/statsApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * ✅ Fetch dashboard stats
 * Response shape: { revenue, serviceTrends, bookings }
 */
export async function getDashboardCharts() {
    try {
        // ✅ Call the backend route (make sure route is /admin/dashboard/stats)
        const { data } = await axiosInstance.get("/dashboard/stats");

        // 🧠 Normalize and fallback
        const revenue = data.revenue || {};
        const serviceTrends = data.serviceTrends || {};
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
            revenue: {},
            serviceTrends: {},
            bookings: {},
            error: err.response?.data?.message || err.message,
        };
    }
}
