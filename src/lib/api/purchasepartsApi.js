import axiosInstance from "./axiosInstance.js";
import { saveAs } from "file-saver";

const PurchasePartsApi = {
    // Create a new purchase invoice
    createInvoice: async (payload) => {
        const { data } = await axiosInstance.post("/purchase-invoices", payload);
        return data;
    },

    // Get logged-in user's invoices with search & filters
    getMyInvoices: async (params = {}) => {
        // params: { search, supplier, paymentStatus, fromDate, toDate, vendorInvoiceNumber }
        const { data } = await axiosInstance.get("/purchase-invoices/my", { params });
        return data;
    },

    // Get invoice by ID (works for user/admin)
    getInvoiceById: async (id) => {
        const { data } = await axiosInstance.get(`/purchase-invoices/${id}`);
        return data;
    },

    // Update invoice status (user)
    updateInvoiceStatus: async (id, payload) => {
        const { data } = await axiosInstance.patch(`/purchase-invoices/${id}/status`, payload);
        return data;
    },

    // Admin: get all invoices with search & filters
    getAllInvoices: async (params = {}) => {
        // params: { search, supplier, purchaser, paymentStatus, fromDate, toDate, vendorInvoiceNumber }
        const { data } = await axiosInstance.get("/purchase-invoices", { params });
        return data;
    },

    // Admin: update invoice
    updateInvoice: async (id, payload) => {
        const { data } = await axiosInstance.put(`/purchase-invoices/${id}`, payload);
        return data;
    },

    // Admin: soft delete invoice
    deleteInvoice: async (id) => {
        const { data } = await axiosInstance.delete(`/purchase-invoices/${id}`);
        return data;
    },

    // Download invoice PDF (user/admin)
    downloadInvoicePdf: async (id, isProforma = false) => {
        const { data } = await axiosInstance.get(`/purchase-invoices/${id}/download`, {
            params: { proforma: isProforma },
            responseType: "blob",
        });
        return data;
    },

    // Helper: download and save PDF directly
    downloadAndSaveInvoice: async (id, isProforma = false) => {
        const blob = await PurchasePartsApi.downloadInvoicePdf(id, isProforma);
        saveAs(blob, `invoice_${id}.pdf`);
    },
};

export default PurchasePartsApi;