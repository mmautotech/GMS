// src/lib/api/invoiceApi.js
import axios from "./axiosInstance.js";

// Ensure baseURL has no trailing slash
const API_URL = axios.defaults.baseURL.replace(/\/$/, "");

export const InvoiceApi = {
    API_URL,

    // 📌 Get invoice by booking ID
    getInvoiceByBookingId: async (bookingId) => {
        const res = await axios.get(`/invoices/booking/${bookingId}`);
        return res.data;
    },

    // 📌 Update invoice
    updateInvoice: async (id, payload) => {
        const res = await axios.put(`/invoices/${id}`, payload);
        return res.data;
    },

    // 📌 View invoice in default browser (with safe fallback)
    viewInvoicePdf: (id, isProforma = false) => {
        let url = `${API_URL}/invoices/${id}/pdf/view`;
        if (isProforma) url += "?proforma=true";

        try {
            if (window.electronAPI && window.electronAPI.openExternal) {
                // ✅ If preload worked → use shell.openExternal
                window.electronAPI.openExternal(url);
            } else {
                // ✅ Fallback → let Electron intercept window.open
                window.open(url, "_blank");
            }
        } catch (err) {
            console.error("Error opening PDF:", err);
            // ✅ Last fallback
            window.open(url, "_blank");
        }
    },

    // 📌 Get all invoices
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
