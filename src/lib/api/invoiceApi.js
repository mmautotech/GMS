// src/lib/api/invoiceApi.js
import axios from "./axiosInstance.js";

export const InvoiceApi = {
    getInvoiceByBookingId: async (bookingId) => {
        try {
            const res = await axios.get(`/invoices/${bookingId}`);
            const data = res.data;

            if (data?.id || data?._id) {
                // normalize id
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
};
