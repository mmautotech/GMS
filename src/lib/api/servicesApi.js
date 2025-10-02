// src/lib/api/serviceApi.js
import axiosInstance from "./axiosInstance.js";

const ServiceApi = {
    /** Full list (without parts populated) */
    getServices: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/service", { params });
            return { success: data.success, services: data.data || [] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Create */
    createService: async (payload) => {
        if (!payload) throw new Error("❌ createService: payload is required");
        try {
            const { data } = await axiosInstance.post("/service", payload);
            return { success: data.success, service: data.data };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Update */
    updateService: async (id, payload) => {
        if (!id) throw new Error("❌ updateService: ID is required");
        try {
            const { data } = await axiosInstance.patch(`/service/${id}`, payload);
            // backend returns only { success, message }
            return { success: data.success, message: data.message };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Soft delete (disable) */
    deleteService: async (id) => {
        if (!id) throw new Error("❌ deleteService: ID is required");
        try {
            const { data } = await axiosInstance.delete(`/service/${id}`);
            // backend returns { success, message, data }
            return { success: data.success, message: data.message };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Reactivate */
    activateService: async (id) => {
        if (!id) throw new Error("❌ activateService: ID is required");
        try {
            const { data } = await axiosInstance.patch(`/service/${id}/activate`);
            return { success: data.success, message: data.message };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Service options (id+name, list | map, filter by enabled) */
    getServiceOptions: async ({ enabled, format = "list" } = {}) => {
        const params = {};
        if (enabled !== undefined) params.enabled = String(enabled);
        if (format) params.format = format;
        try {
            const { data } = await axiosInstance.get("/service/options", { params });
            return { success: data.success, options: data.data || [] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Parts of a single service (active + inactive, with isActive flag) */
    getServiceParts: async (id) => {
        if (!id) throw new Error("❌ getServiceParts: ID is required");
        try {
            const { data } = await axiosInstance.get(`/service/${id}/parts`);
            return { success: data.success, parts: data.data || [] };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Add parts (single or multiple) */
    addPartsToService: async (id, partIds) => {
        if (!id) throw new Error("❌ addPartsToService: ID is required");
        if (!partIds) throw new Error("❌ addPartsToService: partIds required");
        try {
            const { data } = await axiosInstance.post(`/service/${id}/add-parts`, { partIds });
            return { success: data.success, message: data.message };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },

    /** Remove parts (single or multiple) */
    removePartsFromService: async (id, partIds) => {
        if (!id) throw new Error("❌ removePartsFromService: ID is required");
        if (!partIds) throw new Error("❌ removePartsFromService: partIds required");
        try {
            const { data } = await axiosInstance.post(`/service/${id}/remove-parts`, { partIds });
            return { success: data.success, message: data.message };
        } catch (err) {
            return err.response?.data || { success: false, error: err.message };
        }
    },
};

export default ServiceApi;
