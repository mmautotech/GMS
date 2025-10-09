import axiosInstance from "./axiosInstance.js";

/**
 * 🔹 Fetch all internal invoices (with unified filters)
 */
export const getAllInternalInvoices = async ({
    page = 1,
    limit = 25,
    search = "",
    status = "",
    fromDate = "",
    toDate = "",
    sortOn = "landingDate",
    sortOrder = "desc",
} = {}) => {
    const params = {
        page,
        limit,
        search,
        status,
        fromDate,
        toDate,
        sortOn,
        sortOrder,
    };

    console.log("📤 InternalInvoice Request Params:", params);

    try {
        const res = await axiosInstance.get("/internal-invoices", { params });

        const {
            success = false,
            data = [],
            pagination = {},
            params: responseParams = {},
            totals = {
                totalSales: 0,
                totalPurchases: 0,
                totalNetVat: 0,
                totalProfit: 0,
            },
        } = res.data || {};

        // ✅ Ensure all numeric totals are safe
        const safeTotals = {
            totalSales: Number(totals.totalSales || 0),
            totalPurchases: Number(totals.totalPurchases || 0),
            totalNetVat: Number(totals.totalNetVat || 0),
            totalProfit: Number(totals.totalProfit || 0),
        };

        return {
            success,
            data,
            pagination,
            params: responseParams,
            totals: safeTotals,
        };
    } catch (err) {
        console.error("❌ Failed to fetch internal invoices:", err);
        throw err.response?.data || err;
    }
};

/**
 * 🔹 Fetch a single internal invoice by ID
 */
export const getInternalInvoiceById = async (id) => {
    if (!id) throw new Error("Internal invoice ID is required");
    try {
        const res = await axiosInstance.get(`/internal-invoices/${id}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Failed to fetch internal invoice ${id}:`, err);
        throw err.response?.data || err;
    }
};

/**
 * 🔹 Create a new internal invoice
 */
export const createInternalInvoice = async ({ invoiceId }) => {
    if (!invoiceId) throw new Error("invoiceId is required");
    try {
        const res = await axiosInstance.post("/internal-invoices", { invoiceId });
        return res.data;
    } catch (err) {
        console.error("❌ Failed to create internal invoice:", err);
        throw err.response?.data || err;
    }
};

/**
 * 🧾 Export Internal Invoice as PDF (Download)
 */
export const exportInternalInvoiceById = async (id) => {
    if (!id) throw new Error("Internal invoice ID is required");
    try {
        const response = await axiosInstance.get(`/internal-invoices/${id}/pdf/view`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `internal_invoice_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("❌ Failed to export internal invoice PDF:", error);
        throw error.response?.data || error;
    }
};

/**
 * 🪟 View Internal Invoice PDF in New Tab
 */
export const viewInternalInvoicePdf = (id) => {
    if (!id) throw new Error("Internal invoice ID is required");
    const token = localStorage.getItem("token");
    const url = `${axiosInstance.defaults.baseURL}/internal-invoices/${id}/pdf/view?auth=${token}`;
    window.open(url, "_blank");
};
