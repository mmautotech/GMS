// src/lib/api/internalinvoiceApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * Fetch paginated internal invoices with optional filters
 */
export const getAllInternalInvoices = async ({
    page = 1,
    limit = 20,
    search = "",
    fromDate = "",
    toDate = "",
    vehicleRegNo = "",
} = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (vehicleRegNo) params.vehicleRegNo = vehicleRegNo;

    const res = await axiosInstance.get("/internal-invoices", { params });
    return res.data;
};

/**
 * Fetch a single internal invoice by ID
 */
export const getInternalInvoiceById = async (id) => {
    if (!id) throw new Error("Internal invoice ID is required");
    const res = await axiosInstance.get(`/internal-invoices/${id}`);
    return res.data;
};

/**
 * Create a new internal invoice
 */
export const createInternalInvoice = async ({ invoiceId }) => {
    if (!invoiceId) throw new Error("invoiceId is required");
    const res = await axiosInstance.post("/internal-invoices", { invoiceId });
    return res.data;
};

/**
 * ✅ Export / Download Internal Invoice PDF by ID
 */
export const exportInternalInvoiceById = async (id) => {
    if (!id) throw new Error("Internal invoice ID is required");

    try {
        const response = await axiosInstance.get(`/internal-invoices/${id}/pdf/view`, {
            responseType: "blob", // handle PDF correctly
        });

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to download
        const link = document.createElement("a");
        link.href = url;
        link.download = `internal_invoice_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("❌ Failed to export internal invoice PDF:", error);
        throw error;
    }
};

/**
 * 🧾 View Internal Invoice PDF in a new tab (alternative to export)
 */
export const viewInternalInvoicePdf = (id) => {
    if (!id) throw new Error("Internal invoice ID is required");
    const url = `${axiosInstance.defaults.baseURL}/internal-invoices/${id}/pdf/view`;
    window.open(url, "_blank");
};
