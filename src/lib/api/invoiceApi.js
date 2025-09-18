// src/lib/api/invoiceApi.js
import axios from "./axiosInstance.js";

export const InvoiceApi = {
    // Get invoice by booking ID (adjusted for /booking/:bookingId)
    getInvoiceByBookingId: async (bookingId) => {
        try {
            const res = await axios.get(`/invoices/booking/${bookingId}`);
            const data = res.data;

            if (data?._id || data?.id) {
                return {
                    ...data,
                    _id: data._id || data.id,
                    items: data.items || [],
                    discountAmount: data.discountAmount || 0,
                    vatIncluded: data.vatIncluded || false,
                };
            }
            return null;
        } catch (err) {
            console.error("Invoice API error:", err);
            return null;
        }
    },

    updateInvoice: async (id, payload) => {
        try {
            const res = await axios.put(`/invoices/${id}`, payload);
            const data = res.data;
            return {
                ...data,
                _id: data._id || data.id,
                items: data.items || [],
                discountAmount: data.discountAmount || 0,
                vatIncluded: data.vatIncluded || false,
            };
        } catch (err) {
            throw new Error(
                err?.response?.data?.error || err.message || "Failed to update invoice"
            );
        }
    },

    // Download invoice PDF
    downloadInvoicePdf: async (id, filename = "invoice.pdf") => {
        try {
            const res = await axios.get(`/invoices/${id}/pdf`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            throw new Error(
                err?.response?.data?.error || err.message || "Failed to download invoice PDF"
            );
        }
    },

    // Get all invoices with optional pagination
    getAllInvoices: async ({ page = 1, limit = 20, search = "", sortBy = "createdAt", sortDir = "desc" } = {}) => {
        try {
            const res = await axios.get("/invoices", {
                params: { page, limit, search, sortBy, sortDir },
            });
            return res.data; // Expected: { data: [...], total, page, pages }
        } catch (err) {
            console.error("Failed to fetch all invoices:", err);
            return { data: [], total: 0, page: 1, pages: 1 };
        }
    },

    // Get invoice stats
    getInvoiceStats: async () => {
        try {
            const res = await axios.get("/invoices/stats");
            return res.data; // { total, paid, unpaid }
        } catch (err) {
            console.error("Failed to fetch invoice stats:", err);
            return { total: 0, paid: 0, unpaid: 0 };
        }
    },
};
