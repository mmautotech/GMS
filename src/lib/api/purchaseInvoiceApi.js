// src/lib/api/purchaseInvoiceApi.js
import axiosInstance from "./axiosInstance.js";

const PurchaseInvoiceApi = {
    // -------------------------------
    // User routes
    // -------------------------------

    // Create a new purchase invoice
    createInvoice: async (payload) => {
        try {
            const { data } = await axiosInstance.post("/purchase-invoices", payload);
            return {
                success: data.success,
                message: data.message || "Purchase invoice created successfully",
                id: data.id || null, // ✅ backend returns invoice id
                params: null,
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id: null,
                params: null,
                pagination: null,
                data: null,
            };
        }
    },

    // Get logged-in user's invoices (supports filters + pagination)
    getMyInvoices: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/purchase-invoices/my", { params });
            return data; // ✅ { success, params, pagination, data }
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                params,
                pagination: null,
                data: [],
            };
        }
    },

    // Get a single invoice by ID (user & admin)
    getInvoiceById: async (id) => {
        try {
            const { data } = await axiosInstance.get(`/purchase-invoices/${id}`);
            return {
                ...data,
                invoice: data?.data?.[0] || null, // ✅ convenience extraction
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                params: { id },
                pagination: null,
                data: [],
                invoice: null,
            };
        }
    },

    // Update invoice status (user only)
    updateInvoiceStatus: async (id, payload) => {
        try {
            const { data } = await axiosInstance.patch(`/purchase-invoices/${id}/status`, payload);
            return {
                success: data.success,
                message: data.message || "Invoice status updated",
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },

    // -------------------------------
    // Admin routes
    // -------------------------------

    // Get all invoices (supports filters + pagination)
    getAllInvoices: async (params = {}) => {
        try {
            const { data } = await axiosInstance.get("/purchase-invoices", { params });
            return data; // ✅ { success, params, pagination, data }
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                params,
                pagination: null,
                data: [],
            };
        }
    },

    // Update purchase invoice (admin only)
    updateInvoice: async (id, payload) => {
        try {
            const { data } = await axiosInstance.put(`/purchase-invoices/${id}`, payload);
            return {
                success: data.success,
                message: data.message || "Invoice updated successfully",
                id: data.id || id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },

    // Soft delete (deactivate) invoice (admin only)
    deleteInvoice: async (id) => {
        try {
            const { data } = await axiosInstance.delete(`/purchase-invoices/${id}`);
            return {
                success: data.success,
                message: data.message || "Invoice deactivated",
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },
};

export default PurchaseInvoiceApi;
