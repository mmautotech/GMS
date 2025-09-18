import axiosInstance from "./axiosInstance.js";
import { saveAs } from "file-saver";

const PurchasePartsApi = {
    // Create a new purchase invoice
    createInvoice: async (payload) => {
        const { data } = await axiosInstance.post("/purchase-invoices", payload);
        return data;
    },

    // Get logged-in user's invoices with optional query params
    getMyInvoices: async (params = {}) => {
        const { data } = await axiosInstance.get("/purchase-invoices/my", { params });
        return data;
    },

    // Get invoice by ID
    getInvoiceById: async (id) => {
        const { data } = await axiosInstance.get(`/purchase-invoices/${id}`);
        return data;
    },

    // Update invoice status (user)
    updateInvoiceStatus: async (id, payload) => {
        const { data } = await axiosInstance.patch(`/purchase-invoices/${id}/status`, payload);
        return data;
    },

    // Admin: get all invoices with optional query params
    getAllInvoices: async (params = {}) => {
        const { data } = await axiosInstance.get("/purchase-invoices", { params });
        return data;
    },

    // Admin: update an invoice
    updateInvoice: async (id, payload) => {
        const { data } = await axiosInstance.put(`/purchase-invoices/${id}`, payload);
        return data;
    },

    // Admin: soft delete an invoice
    deleteInvoice: async (id) => {
        const { data } = await axiosInstance.delete(`/purchase-invoices/${id}`);
        return data;
    },

    // Download invoice PDF (user or admin)
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
