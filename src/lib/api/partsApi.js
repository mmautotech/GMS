// src/lib/api/partsApi.js
import axiosInstance from "./axiosInstance.js";

// 🔹 Normalize API response into consistent object (only partName kept)
const normalizeParts = (arr) =>
    (arr || []).map((p) => ({
        _id: p._id,
        partName: p.partName || "",
        isActive: p.isActive ?? true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        // For dropdowns / selects
        label: p.partName,
    }));

const PartsApi = {
    /** Get all parts */
    getParts: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/parts", { params });
            return {
                success: data.success,
                parts: normalizeParts(data.data),
                pagination: data.pagination || null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                parts: [],
            };
        }
    },

    /** Get single part by ID */
    getPartById: async (id) => {
        if (!id) throw new Error("❌ getPartById: ID is required");
        try {
            const { data } = await axiosInstance.get(`/parts/${id}`);
            return {
                success: data.success,
                part: data.data ? normalizeParts([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                part: null,
            };
        }
    },

    /** Create part */
    createPart: async (payload) => {
        try {
            const { serviceId, ...cleanPayload } = payload; // strip if passed accidentally
            const { data } = await axiosInstance.post("/parts", cleanPayload);
            return {
                success: data.success,
                part: data.data ? normalizeParts([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                part: null,
            };
        }
    },

    /** Update part */
    updatePart: async (id, payload) => {
        try {
            const { serviceId, ...cleanPayload } = payload;
            const { data } = await axiosInstance.put(`/parts/${id}`, cleanPayload);
            return {
                success: data.success,
                part: data.data ? normalizeParts([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                part: null,
            };
        }
    },

    /** Deactivate (soft delete) */
    deactivatePart: async (id) => {
        try {
            const { data } = await axiosInstance.delete(`/parts/${id}`);
            return {
                success: data.success,
                part: data.data ? normalizeParts([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                part: null,
            };
        }
    },

    /** Reactivate */
    activatePart: async (id) => {
        try {
            const { data } = await axiosInstance.patch(`/parts/${id}/activate`);
            return {
                success: data.success,
                part: data.data ? normalizeParts([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                part: null,
            };
        }
    },

    /** Dropdown options */
    getPartsDropdown: async () => {
        try {
            const { data } = await axiosInstance.get("/parts/dropdown");
            return {
                success: data.success,
                parts: (data.data || []).map((p) => ({
                    _id: p.id,       // normalize id → _id
                    label: p.label,  // backend already returns partName
                })),
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                parts: [],
            };
        }
    },

    /** Get parts linked to booking */
    getPartsByBooking: async (bookingId) => {
        try {
            const { data } = await axiosInstance.get(`/parts/by-booking/${bookingId}`);
            return {
                success: data.success,
                parts: (data.data || []).map((p) => ({
                    _id: p.id,
                    label: p.label,
                })),
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                parts: [],
            };
        }
    },
};

export default PartsApi;
