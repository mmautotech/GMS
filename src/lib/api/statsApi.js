// src/lib/api/statsApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * ✅ Fetch dashboard stats
 * Response shape: { revenue, serviceTrends, bookings }
 */
export async function getDashboardCharts() {
    try {
        const { data } = await axiosInstance.get("/dashboard/stats");
        return {
            success: true,
            revenue: data.revenue || {},
            serviceTrends: data.serviceTrends || {},
            bookings: data.bookings || {},
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
