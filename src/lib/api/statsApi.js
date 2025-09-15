// src/lib/api/statApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * ✅ Fetch dashboard chart stats (monthly revenue & service trends)
 */
export async function getDashboardCharts() {
    try {
        const { data } = await axiosInstance.get("/dashboard/stats");
        return data; // { monthlyRevenue: [...], serviceTrends: [...] }
    } catch (err) {
        console.error("Failed to fetch dashboard chart data:", err);
        throw err;
    }
}
