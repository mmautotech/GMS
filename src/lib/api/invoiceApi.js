import axios from "./axiosInstance.js";

// ✅ Ensure baseURL has no trailing slash
const API_URL = axios.defaults.baseURL?.replace(/\/$/, "") || "";

/**
 * 🧾 Invoice API — Fully aligned with backend (no /stats route)
 */
export const InvoiceApi = {
    API_URL,

    // ----------------------------------------
    // 📄 GET /api/invoices/booking/:bookingId
    // ----------------------------------------
    getInvoiceByBookingId: async (bookingId) => {
        try {
            const res = await axios.get(`/invoices/booking/${bookingId}`);
            const { success, exists, invoice } = res.data;
            return success && exists ? invoice : null;
        } catch (err) {
            console.error("❌ getInvoiceByBookingId error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to fetch invoice"
            );
        }
    },

    // ----------------------------------------
    // 🧾 POST /api/invoices/booking/:bookingId/generate
    // ----------------------------------------
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

    // ----------------------------------------
    // ✏️ PUT /api/invoices/:invoiceId
    // ----------------------------------------
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

    // ----------------------------------------
    // 🧾 GET /api/invoices/:invoiceId/pdf/view
    // ----------------------------------------
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
            window.open(url, "_blank");
        }
    },

    // ----------------------------------------
    // 📊 GET /api/invoices
    // ----------------------------------------
    getAllInvoices: async (params = {}) => {
        try {
            // ✅ Apply safe defaults consistent with backend + validator
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 10,
                search: params.search || "",
                status: params.status || "",
                fromDate: params.fromDate || "",
                toDate: params.toDate || "",
                sortOn: params.sortOn || "createdAt",
                sortOrder: params.sortOrder || "desc",
            };

            const res = await axios.get("/invoices", { params: queryParams });
            const {
                success,
                message,
                data,
                totals,
                pagination,
                params: backendParams,
                appliedFilters,
            } = res.data;

            if (!success) throw new Error(message || "Failed to fetch invoices");

            return {
                invoices: data || [],
                totals: totals || {},
                pagination: pagination || {},
                params: backendParams || queryParams,
                filters: appliedFilters || {},
                message,
            };
        } catch (err) {
            console.error("❌ getAllInvoices error:", err);
            throw new Error(
                err?.response?.data?.message || "Failed to fetch invoices"
            );
        }
    },
};
