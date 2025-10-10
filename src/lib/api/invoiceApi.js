// src/lib/api/invoiceApi.js
import axios from "./axiosInstance.js";

// ✅ Ensure baseURL has no trailing slash
const API_URL = axios.defaults.baseURL?.replace(/\/$/, "") || "";

/**
 * 🧾 Invoice API — Fully aligned with backend structure
 * Consistent normalization, error handling, and route matching.
 */
export const InvoiceApi = {
    API_URL,

    /**
     * 📌 Get Invoice by Booking ID (fetch only)
     * - GET /api/invoices/booking/:bookingId
     * - Returns: { success, exists, invoice }
     */
    getInvoiceByBookingId: async (bookingId) => {
        try {
            const res = await axios.get(`/invoices/booking/${bookingId}`);
            const { success, exists, invoice } = res.data;

            if (!success || !exists) return null;
            return invoice;
        } catch (err) {
            console.error("❌ getInvoiceByBookingId error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to fetch invoice"
            );
        }
    },

    /**
     * 🧾 Generate or Regenerate Invoice for Booking
     * - POST /api/invoices/booking/:bookingId/generate
     * - Always creates or updates the invoice for that booking
     */
    generateInvoiceByBookingId: async (bookingId) => {
        try {
            const res = await axios.post(`/invoices/booking/${bookingId}/generate`);
            const { success, invoice } = res.data;

            if (!success) throw new Error("Invoice generation failed");
            return invoice;
        } catch (err) {
            console.error("❌ generateInvoiceByBookingId error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to generate invoice"
            );
        }
    },

    /**
     * ✏️ Update Invoice (items, discount, VAT, status)
     * - PUT /api/invoices/:invoiceId
     * - Returns updated invoice object
     */
    updateInvoice: async (invoiceId, payload) => {
        try {
            const res = await axios.put(`/invoices/${invoiceId}`, payload);
            const { success, invoice } = res.data;

            if (!success) throw new Error("Invoice update failed");
            return invoice;
        } catch (err) {
            console.error("❌ updateInvoice error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to update invoice"
            );
        }
    },

    /**
     * 🧾 View Invoice PDF (inline browser or Electron)
     * - GET /api/invoices/:invoiceId/pdf/view
     * - Optional ?proforma=true
     */
    viewInvoicePdf: (invoiceId, isProforma = false) => {
        let url = `${API_URL}/invoices/${invoiceId}/pdf/view`;
        if (isProforma) url += "?proforma=true";

        try {
            if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(url);
            } else {
                window.open(url, "_blank");
            }
        } catch (err) {
            console.error("⚠️ Error opening invoice PDF:", err);
            window.open(url, "_blank"); // safe fallback
        }
    },

    /**
     * 📊 Get All Invoices (with filters, pagination, and totals)
     * - GET /api/invoices
     * - Returns { success, message, params, appliedFilters, pagination, totals, data }
     */
    getAllInvoices: async (params = {}) => {
        try {
            const res = await axios.get("/invoices", { params });
            const { success, data, totals, pagination, message } = res.data;

            if (!success) throw new Error(message || "Failed to fetch invoices");
            return {
                invoices: data || [],
                totals,
                pagination,
                message,
            };
        } catch (err) {
            console.error("❌ getAllInvoices error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to fetch invoices"
            );
        }
    },

    /**
     * 📈 Get Invoice Stats (summary by status)
     * - GET /api/invoices/stats
     */
    getInvoiceStats: async () => {
        try {
            const res = await axios.get("/invoices/stats");
            const { success, data } = res.data;

            if (!success) throw new Error("Failed to fetch invoice stats");
            return data;
        } catch (err) {
            console.error("❌ getInvoiceStats error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to fetch invoice stats"
            );
        }
    },
};
