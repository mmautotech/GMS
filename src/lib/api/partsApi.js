// src/lib/api/partsApi.js
import axiosInstance from "./axiosInstance.js";

const PartsApi = {
    /**
     * ✅ Get all parts (supports filters: q, includeInactive, onlyInactive)
     */
    getParts: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/parts", { params });
            return {
                success: true,
                parts: Array.isArray(data.data) ? data.data : [],
                meta: data.meta || {
                    totalParts: 0,
                    activeParts: 0,
                    inactiveParts: 0,
                },
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Get a single part by ID
     */
    getPartById: async (id) => {
        if (!id) throw new Error("❌ getPartById: ID is required");
        try {
            const { data } = await axiosInstance.get(`/parts/${id}`);
            return { success: true, part: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Create a new part
     */
    createPart: async (payload) => {
        if (!payload) throw new Error("❌ createPart: payload is required");
        try {
            const { data } = await axiosInstance.post("/parts", payload);
            return { success: true, part: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Update an existing part
     */
    updatePart: async (id, payload) => {
        if (!id) throw new Error("❌ updatePart: ID is required");
        if (!payload) throw new Error("❌ updatePart: payload is required");
        try {
            const { data } = await axiosInstance.put(`/parts/${id}`, payload);
            return { success: true, part: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Deactivate a part
     */
    deactivatePart: async (id) => {
        if (!id) throw new Error("❌ deactivatePart: ID is required");
        try {
            const { data } = await axiosInstance.delete(`/parts/${id}`);
            return { success: true, part: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Reactivate a part
     */
    activatePart: async (id) => {
        if (!id) throw new Error("❌ activatePart: ID is required");
        try {
            const { data } = await axiosInstance.patch(`/parts/${id}/activate`);
            return { success: true, part: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /**
     * ✅ Dropdown list for parts (active only)
     */
    getPartsDropdown: async () => {
        try {
            const { data } = await axiosInstance.get("/parts/dropdown");
            return { success: true, parts: data.data || [] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },
};

export default PartsApi;
