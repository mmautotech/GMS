import axiosInstance from "./axiosInstance.js";

/**
 * Fetch paginated internal invoices with optional search, date, and vehicle filters
 * @param {Object} options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Number of records per page
 * @param {string} options.search - Optional search keyword
 * @param {string} options.fromDate - Optional start date filter
 * @param {string} options.toDate - Optional end date filter
 * @param {string} options.vehicleRegNo - Optional vehicle registration number filter
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
 * @param {string} id - Internal invoice ID
 */
export const getInternalInvoiceById = async (id) => {
    const res = await axiosInstance.get(`/internal-invoices/${id}`);
    return res.data;
};

/**
 * Create a new internal invoice
 * Only invoiceId is required in the body
 * @param {Object} payload
 * @param {string} payload.invoiceId - Main invoice ID
 */
export const createInternalInvoice = async ({ invoiceId }) => {
    if (!invoiceId) throw new Error("invoiceId is required");
    const res = await axiosInstance.post("/internal-invoices", { invoiceId });
    return res.data;
};
