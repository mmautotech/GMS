// src/lib/api/usersApi.js
import axiosInstance from "./axiosInstance.js";

/** ✅ Fetch minimal id+username options (like services) */
export async function getUserOptions({ format = "list" } = {}) {
    const params = {};
    if (format) params.format = format; // "list" | "map"
    const { data } = await axiosInstance.get("/users/options", { params });

    if (data?.success === false) {
        throw new Error(data?.error || "Failed to fetch user options");
    }
    return data?.data ?? [];
}
