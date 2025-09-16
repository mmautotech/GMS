// src/lib/api/partsApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * ✅ Get all parts (with optional search/filter)
 * @param {Object} params - query params like { q, includeInactive, onlyInactive, page, limit }
 * @returns {Object} { parts: [], meta: { totalParts, activeParts, inactiveParts } }
 */
export async function getParts(params = {}) {
    const { data } = await axiosInstance.get("/parts", { params });

    // Always return parts array and meta info
    return {
        parts: Array.isArray(data.data) ? data.data : [],
        meta: data.meta || {
            totalParts: 0,
            activeParts: 0,
            inactiveParts: 0,
        },
    };
}

/**
 * ✅ Get a single part by ID
 */
export async function getPartById(id) {
    if (!id) throw new Error("❌ getPartById: ID is required");
    const { data } = await axiosInstance.get(`/parts/${id}`);
    return data.data || null;
}

/**
 * ✅ Create a new part (admin only)
 */
export async function createPart(payload) {
    if (!payload) throw new Error("❌ createPart: payload is required");
    const { data } = await axiosInstance.post("/parts", payload);
    return data.data || null;
}

/**
 * ✅ Update an existing part (admin only)
 */
export async function updatePart(id, payload) {
    if (!id) throw new Error("❌ updatePart: ID is required");
    if (!payload) throw new Error("❌ updatePart: payload is required");
    const { data } = await axiosInstance.put(`/parts/${id}`, payload);
    return data.data || null;
}

/**
 * ✅ Deactivate a part (soft delete, admin only)
 */
export async function deactivatePart(id) {
    if (!id) throw new Error("❌ deactivatePart: ID is required");
    const { data } = await axiosInstance.delete(`/parts/${id}`);
    return data.data || null;
}

/**
 * ✅ Reactivate a part (admin only)
 */
export async function activatePart(id) {
    if (!id) throw new Error("❌ activatePart: ID is required");
    const { data } = await axiosInstance.patch(`/parts/${id}/activate`);
    return data.data || null;
}
