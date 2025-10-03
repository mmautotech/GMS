// src/lib/api/serviceApi.js
import axiosInstance from "./axiosInstance.js";

// --- Normalizers ---
const normalizeServices = (arr) =>
    (arr || []).map((s) => ({
        _id: s._id || s.id,
        name: s.name || "",
        enabled: s.enabled ?? true,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        // Backend returns parts as [{ id, label }]
        parts: Array.isArray(s.parts)
            ? s.parts.map((p) => ({ _id: p._id || p.id, label: p.label }))
            : [],
        partsCount: s.partsCount ?? (s.parts ? s.parts.length : 0),
        label: s.name,
    }));

const normalizeParts = (arr) =>
    (arr || []).map((p) => ({
        _id: p._id || p.id,
        label: p.label || p.partName || "",
    }));

const normalizeServiceOptions = (arr) =>
    (arr || []).map((s) => ({
        id: s.id,
        name: s.name,
        label: s.name, // good for <select> dropdowns
        value: s.id,   // standard value field
    }));

// --- API ---
const ServiceApi = {
    /** List all services (ids only for parts + count) */
    getServices: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/service", { params });
            return { success: data.success, services: normalizeServices(data.data) };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Get service by ID (with parts populated) */
    getServiceById: async (id) => {
        try {
            const { data } = await axiosInstance.get(`/service/${id}`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
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
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Update service (returns updated with parts) */
    updateService: async (id, payload) => {
        try {
            const { data } = await axiosInstance.patch(`/service/${id}`, payload);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "",
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Soft delete (returns updated service with parts) */
    deleteService: async (id) => {
        try {
            const { data } = await axiosInstance.delete(`/service/${id}`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "",
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Reactivate (returns updated service with parts) */
    activateService: async (id) => {
        try {
            const { data } = await axiosInstance.patch(`/service/${id}/activate`);
            return {
                success: data.success,
                service: data.data ? normalizeServices([data.data])[0] : null,
                message: data.message || "",
            };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Options (id+name only, for dropdowns) */
    getServiceOptions: async ({ enabled, format = "list" } = {}) => {
        const params = {};
        if (enabled !== undefined) params.enabled = String(enabled);
        if (format) params.format = format;
        try {
            const { data } = await axiosInstance.get("/service/options", { params });
            return { success: data.success, options: normalizeServiceOptions(data.data) };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Get only parts of a service */
    getServiceParts: async (id) => {
        try {
            const { data } = await axiosInstance.get(`/service/${id}/parts`);
            return { success: data.success, parts: normalizeParts(data.data) };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },
};

export default ServiceApi;
