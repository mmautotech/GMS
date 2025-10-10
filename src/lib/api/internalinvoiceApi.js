import axiosInstance from "./axiosInstance.js";

/**
 * ======================================================
 * 🔹 Fetch all Internal Invoices (with filters & pagination)
 * Matches backend Zod schema exactly
 * ======================================================
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

        // ✅ Normalize totals safely
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
 * ======================================================
 * 🔹 Fetch a Single Internal Invoice by ID
 * @route GET /api/internal-invoices/:id
 * ======================================================
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
 * ======================================================
 * 🔹 Create or Update Internal Invoice
 * @route POST /api/internal-invoices
 * Body: { invoiceId, purchaseInvoiceIds? }
 * ======================================================
 */
export const createInternalInvoice = async ({ invoiceId, purchaseInvoiceIds = [] }) => {
    if (!invoiceId) throw new Error("invoiceId is required");
    try {
        const res = await axiosInstance.post("/internal-invoices", {
            invoiceId,
            purchaseInvoiceIds,
        });
        return res.data;
    } catch (err) {
        console.error("❌ Failed to create internal invoice:", err);
        throw err.response?.data || err;
    }
};

/**
 * ======================================================
 * 🧾 View Internal Invoice PDF (Inline in Browser)
 * Opens PDF in new browser tab (no download)
 * @route GET /api/internal-invoices/:id/pdf/view
 * ======================================================
 */
export const exportInternalInvoiceById = (id) => {
    if (!id) throw new Error("Internal invoice ID is required");

    const baseURL = axiosInstance.defaults.baseURL.replace(/\/$/, "");
    const token = localStorage.getItem("token");

    // ✅ Construct inline-view URL with optional auth token
    const url = `${baseURL}/internal-invoices/${id}/pdf/view${token ? `?auth=${token}` : ""}`;

    console.log("🪟 Opening Internal Invoice PDF inline:", url);

    try {
        // For Electron builds
        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            // For normal browsers
            window.open(url, "_blank");
        }
    } catch (err) {
        console.error("⚠️ Error opening internal invoice PDF:", err);
        window.open(url, "_blank");
    }
};
