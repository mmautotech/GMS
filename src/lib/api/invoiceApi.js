// src/lib/api/invoiceApi.js
import axios from "./axiosInstance.js";

// Ensure baseURL has no trailing slash
const API_URL = axios.defaults.baseURL.replace(/\/$/, "");

export const InvoiceApi = {
    API_URL,

    // 📌 Get invoice by booking ID (fetch only, will auto-generate if missing inside controller)
    getInvoiceByBookingId: async (bookingId) => {
        const res = await axios.get(`/invoices/booking/${bookingId}`);
        return res.data;
    },

    // 📌 Explicitly generate (or regenerate) invoice for booking
    generateInvoiceByBookingId: async (bookingId, payload = {}) => {
        const res = await axios.post(`/invoices/booking/${bookingId}/generate`, payload);
        return res.data;
    },

    // 📌 Update invoice
    updateInvoice: async (id, payload) => {
        const res = await axios.put(`/invoices/${id}`, payload);
        return res.data;
    },

    // 📌 View invoice in default browser (inline, supports proforma)
    viewInvoicePdf: (id, isProforma = false) => {
        let url = `${API_URL}/invoices/${id}/pdf/view`;
        if (isProforma) url += "?proforma=true";

        try {
            if (window.electronAPI?.openExternal) {
                // ✅ Electron → open in system browser
                window.electronAPI.openExternal(url);
            } else {
                // ✅ Browser fallback
                window.open(url, "_blank");
            }
        } catch (err) {
            console.error("Error opening PDF:", err);
            window.open(url, "_blank"); // last fallback
        }
    },

    // 📌 Get all invoices (with filters & pagination)
    getAllInvoices: async (params = {}) => {
        const res = await axios.get("/invoices", { params });
        return res.data;
    },

    // 📌 Get invoice stats
    getInvoiceStats: async () => {
        const res = await axios.get("/invoices/stats");
        return res.data;
    },
};
