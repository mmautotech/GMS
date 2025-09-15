// src/lib/api/partsApi.js
import axiosInstance from "./axiosInstance.js";

// ✅ Get all parts (with optional search/filter)
export async function getParts(params = {}) {
    const { data } = await axiosInstance.get("/parts", { params });
    return data;
}

// ✅ Get a single part by ID
export async function getPartById(id) {
    if (!id) throw new Error("❌ getPartById: ID is required");
    const { data } = await axiosInstance.get(`/parts/${id}`);
    return data;
}

// ✅ Create a new part
export async function createPart(payload) {
    if (!payload) throw new Error("❌ createPart: payload is required");
    const { data } = await axiosInstance.post("/parts", payload);
    return data;
}

// ✅ Full update of an existing part
export async function updatePart(id, payload) {
    if (!id) throw new Error("❌ updatePart: ID is required");
    if (!payload) throw new Error("❌ updatePart: payload is required");

    // Use PUT for full update
    const { data } = await axiosInstance.put(`/parts/${id}`, payload);
    return data;
}

// ✅ Delete a part
export async function deletePart(id) {
    if (!id) throw new Error("❌ deletePart: ID is required");
    const { data } = await axiosInstance.delete(`/parts/${id}`);
    return data;
}

// ✅ Restock a part (partial update)
export async function restockPart(id, quantity) {
    if (!id) throw new Error("❌ restockPart: ID is required");
    if (!quantity || quantity <= 0) throw new Error("❌ restockPart: quantity must be positive");

    const { data } = await axiosInstance.patch(`/parts/${id}/restock`, { quantity });
    return data;
}
