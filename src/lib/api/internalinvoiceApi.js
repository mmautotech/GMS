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
 * 🧾 View Internal Invoice PDF (Inline View in Browser)
 * @route GET /api/internal-invoices/:id/pdf/view
 * ✅ Opens in new browser tab (NOT downloaded)
 * ======================================================
 */
export const viewInternalInvoicePdf = (id) => {
    if (!id) throw new Error("Internal invoice ID is required");

    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("⚠️ No auth token found in localStorage");
    }

    // ✅ Construct inline-view URL with auth token
    const baseURL = axiosInstance.defaults.baseURL.replace(/\/$/, "");
    const url = `${baseURL}/internal-invoices/${id}/pdf/view?auth=${token}`;

    console.log("🪟 Opening Internal Invoice PDF:", url);
    window.open(url, "_blank");
};

/**
 * ======================================================
 * 📥 Export Internal Invoice PDF (Download version)
 * @route GET /api/internal-invoices/:id/pdf/view
 * ⚙️ This is optional — in case you still want a file download
 * ======================================================
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

        console.log(`✅ PDF downloaded: internal_invoice_${id}.pdf`);
    } catch (error) {
        console.error("❌ Failed to download internal invoice PDF:", error);
        throw error.response?.data || error;
    }
};
