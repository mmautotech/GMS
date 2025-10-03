import axiosInstance from "./axiosInstance.js";

// 🟢 shared normalizer
const normalizeParams = (params = {}) => {
    const normalized = { ...params };

    // convert date strings → ISO
    if (normalized.startDate instanceof Date) {
        normalized.startDate = normalized.startDate.toISOString();
    }
    if (normalized.endDate instanceof Date) {
        normalized.endDate = normalized.endDate.toISOString();
    }

    return normalized;
};

const PurchaseInvoiceApi = {
    // Create invoice
    createInvoice: async (payload) => {
        try {
            const { data } = await axiosInstance.post("/purchase-invoices", payload);
            return {
                success: data.success,
                message: data.message || "Purchase invoice created successfully",
                id: data.id || null,
                params: null,
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id: null,
                params: null,
                pagination: null,
                data: null,
            };
        }
    },

    // Get invoices
    getInvoices: async (params = {}) => {
        try {
            const normalized = normalizeParams(params);
            const { data } = await axiosInstance.get("/purchase-invoices", { params: normalized });
            return data; // { success, params, pagination, data }
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                params,
                pagination: null,
                data: [],
            };
        }
    },

    // Get invoices by booking ID (dashboard)
    getInvoicesByBookingId: async (bookingId) => {
        try {
            const { data } = await axiosInstance.get(`/purchase-invoices/booking/${bookingId}`);

            // Normalize items: add partName and partNumber
            const normalizedInvoices = data.map((inv) => ({
                ...inv,
                items: inv.items.map((item) => ({
                    ...item,
                    partName: item.part?.partName || "Unknown Part",
                    partNumber: item.part?.partNumber || "",
                })),
            }));

            return normalizedInvoices;
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                bookingId,
                data: [],
            };
        }
    },

    // Get single invoice by ID
    getInvoiceById: async (id) => {
        try {
            const { data } = await axiosInstance.get(`/purchase-invoices/${id}`);
            const invoice = data?.data?.[0] || null;

            if (invoice) {
                invoice.items = invoice.items.map((item) => ({
                    ...item,
                    partName: item.part?.partName || "Unknown Part",
                    partNumber: item.part?.partNumber || "",
                }));
            }

            return {
                ...data,
                invoice,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                params: { id },
                pagination: null,
                data: [],
                invoice: null,
            };
        }
    },

    // Update only status
    updateInvoiceStatus: async (id, payload) => {
        try {
            const { data } = await axiosInstance.patch(`/purchase-invoices/${id}/status`, payload);
            return {
                success: data.success,
                message: data.message || "Invoice status updated",
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },

    // Full update
    updateInvoice: async (id, payload) => {
        try {
            const { data } = await axiosInstance.put(`/purchase-invoices/${id}`, payload);
            return {
                success: data.success,
                message: data.message || "Purchase invoice updated successfully",
                id: data.id || id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },

    // Delete invoice
    deleteInvoice: async (id) => {
        try {
            const { data } = await axiosInstance.delete(`/purchase-invoices/${id}`);
            return {
                success: data.success,
                message: data.message || "Invoice deactivated",
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        } catch (err) {
            return err.response?.data || {
                success: false,
                error: err.message,
                id,
                params: { id },
                pagination: null,
                data: null,
            };
        }
    },
};

export default PurchaseInvoiceApi;
