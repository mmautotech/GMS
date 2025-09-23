// src/lib/api/serviceApi.js
import axiosInstance from "./axiosInstance.js";

/** Full list (already existed) */
export async function getServices(params = {}) {
    const { data } = await axiosInstance.get("/service", { params });
    return data;
}

/** Create */
export async function createService(payload) {
    if (!payload) throw new Error("❌ createService: payload is required");
    const { data } = await axiosInstance.post("/service", payload);
    return data;
}

/** Update */
export async function updateService(id, payload) {
    if (!id) throw new Error("❌ updateService: ID is required");
    const { data } = await axiosInstance.patch(`/service/${id}`, payload);
    return data;
}

/** Delete */
export async function deleteService(id) {
    if (!id) throw new Error("❌ deleteService: ID is required");
    const { data } = await axiosInstance.delete(`/service/${id}`);
    return data;
}

/** ✅ NEW: minimal id+name options, optionally filter by enabled, choose output shape */
export async function getServiceOptions({ enabled, format = "list" } = {}) {
    const params = {};
    if (enabled !== undefined) params.enabled = String(enabled);
    if (format) params.format = format; // "list" | "map"
    const { data } = await axiosInstance.get("/service/options", { params });
    // Controller returns { success, data, meta }
    if (data?.success === false) {
        throw new Error(data?.error || "Failed to fetch service options");
    }
    return data?.data ?? [];
}
