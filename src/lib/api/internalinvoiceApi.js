// src/lib/api/internalInvoiceApi.js
import axiosInstance from "./axiosInstance.js";

/**
 * Fetch paginated internal invoices with optional search and date filters
 * @param {Object} options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 20)
 * @param {string} options.search - Search text for vehicleRegNo or items.description
 * @param {string} options.fromDate - Start date filter (YYYY-MM-DD)
 * @param {string} options.toDate - End date filter (YYYY-MM-DD)
 */
export const getAllInternalInvoices = ({
    page = 1,
    limit = 20,
    search = "",
    fromDate = "",
    toDate = "",
} = {}) => {
    const params = { page, limit };

    if (search) params.search = search;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    return axiosInstance.get("/internal-invoices", { params });
};

/**
 * Fetch a single internal invoice by ID
 * @param {string} id
 */
export const getInternalInvoiceById = (id) => {
    return axiosInstance.get(`/internal-invoices/${id}`);
};

/**
 * Delete an internal invoice
 * @param {string} id
 */
export const deleteInternalInvoice = (id) => {
    return axiosInstance.delete(`/internal-invoices/${id}`);
};

/**
 * Generate internal invoice from a main invoice
 * @param {Object} payload
 * @param {string} payload.invoiceId - Main invoice ID
 */
export const generateInternalInvoice = ({ invoiceId }) => {
    return axiosInstance.post("/internal-invoices/generate", { invoiceId });
};