// src/lib/api/partsApi.js
import axiosInstance from "./axiosInstance.js";

const normalizeParts = (arr) =>
    (arr || []).map((p) => ({
        _id: p._id || p.id, // handle both { _id } and { id }
        label:
            p.label || (p.partNumber ? `${p.partName} (${p.partNumber})` : p.partName),
        partNumber: p.partNumber || null,
        partName: p.partName || p.label || null,
    }));

const PartsApi = {
    /** Get all ACTIVE parts (q supported) */
    getParts: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/parts", { params });
            return {
                success: data.success,
                parts: normalizeParts(data.data),
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Get single part (active + inactive allowed) */
    getPartById: async (id) => {
        if (!id) throw new Error("❌ getPartById: ID is required");
        try {
            const { data } = await axiosInstance.get(`/parts/${id}`);
            return {
                success: data.success,
                part: data.data
                    ? {
                        _id: data.data._id || data.data.id,
                        label:
                            data.data.label ||
                            (data.data.partNumber
                                ? `${data.data.partName} (${data.data.partNumber})`
                                : data.data.partName),
                        partNumber: data.data.partNumber || null,
                        partName: data.data.partName || data.data.label || null,
                    }
                    : null,
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Create */
    createPart: async (payload) => {
        if (!payload) throw new Error("❌ createPart: payload is required");
        try {
            const { data } = await axiosInstance.post("/parts", payload);
            return { success: data.success, part: normalizeParts([data.data])[0] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Update */
    updatePart: async (id, payload) => {
        if (!id) throw new Error("❌ updatePart: ID is required");
        if (!payload) throw new Error("❌ updatePart: payload is required");
        try {
            const { data } = await axiosInstance.put(`/parts/${id}`, payload);
            return { success: data.success, part: normalizeParts([data.data])[0] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Deactivate (soft delete) */
    deactivatePart: async (id) => {
        if (!id) throw new Error("❌ deactivatePart: ID is required");
        try {
            const { data } = await axiosInstance.delete(`/parts/${id}`);
            return { success: data.success, part: normalizeParts([data.data])[0] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Reactivate */
    activatePart: async (id) => {
        if (!id) throw new Error("❌ activatePart: ID is required");
        try {
            const { data } = await axiosInstance.patch(`/parts/${id}/activate`);
            return { success: data.success, part: normalizeParts([data.data])[0] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Dropdown (active parts only) */
    getPartsDropdown: async () => {
        try {
            const { data } = await axiosInstance.get("/parts/dropdown");
            return { success: data.success, parts: normalizeParts(data.data) };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Parts by booking.services */
    getPartsByBooking: async (bookingId) => {
        if (!bookingId) throw new Error("❌ getPartsByBooking: bookingId is required");
        try {
            const { data } = await axiosInstance.get(`/parts/by-booking/${bookingId}`);
            return { success: data.success, parts: normalizeParts(data.data) };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },
};

export default PartsApi;
