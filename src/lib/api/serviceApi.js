// src/lib/api/serviceApi.js
import axiosInstance from "./axiosInstance.js";

// --- Normalizers ---
const normalizeParts = (arr) =>
    (arr || []).map((p) => ({
        _id: p._id || p.id,
        partName: p.partName || p.label || "",
        isActive: p.isActive ?? true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        label: p.partName || p.label || "",
    }));

const normalizeServices = (arr) =>
    (arr || []).map((s) => ({
        _id: s._id || s.id,
        name: s.name || "",
        enabled: s.enabled ?? true,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        parts: normalizeParts(s.parts || []),
        partsCount: s.partsCount ?? (s.parts ? s.parts.length : 0),
        label: s.name,
    }));

const normalizeServiceOptions = (arr) =>
    (arr || []).map((s) => ({
        id: s.id || s._id,
        name: s.name,
        label: s.name,
        value: s.id || s._id,
    }));

// --- API ---
const ServiceApi = {
    /** List all services */
    getServices: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/service", { params });
            return {
                success: data.success,
                services: normalizeServices(data.data),
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                services: [],
            };
        }
    },

    /** Get service by ID (with populated parts) */
    getServiceById: async (id) => {
        if (!id) throw new Error("❌ getServiceById: ID is required");
        try {
            const { data } = await axiosInstance.get(`/service/${id}`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                service: null,
            };
        }
    },

    /** Create a new service */
    createService: async (payload) => {
        try {
            const { data } = await axiosInstance.post("/service", payload);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                service: null,
            };
        }
    },

    /** Update a service */
    updateService: async (id, payload) => {
        try {
            const { data } = await axiosInstance.patch(`/service/${id}`, payload);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "Service updated successfully",
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                service: null,
            };
        }
    },

    /** Soft delete service */
    deleteService: async (id) => {
        try {
            const { data } = await axiosInstance.delete(`/service/${id}`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "Service disabled successfully",
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                service: null,
            };
        }
    },

    /** Reactivate service */
    activateService: async (id) => {
        try {
            const { data } = await axiosInstance.patch(`/service/${id}/activate`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "Service reactivated successfully",
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                service: null,
            };
        }
    },

    /** Get dropdown options (id + name) */
    getServiceOptions: async ({ enabled, format = "list" } = {}) => {
        const params = {};
        if (enabled !== undefined) params.enabled = String(enabled);
        if (format) params.format = format;
        try {
            const { data } = await axiosInstance.get("/service/options", { params });
            return {
                success: data.success,
                options: normalizeServiceOptions(data.data),
            };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || err.message,
                options: [],
            };
        }
    },

    /** Get only parts of a service */
    getServiceParts: async (id) => {
        if (!id) throw new Error("❌ getServiceParts: ID is required");
        try {
            const { data } = await axiosInstance.get(`/service/${id}/parts`);
            return {
                success: data.success,
                parts: normalizeParts(data.data),
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

export default ServiceApi;
