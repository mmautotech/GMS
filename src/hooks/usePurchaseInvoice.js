// src/hooks/usePurchaseInvoice.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PurchaseInvoiceApi from "../lib/api/purchaseInvoiceApi.js";

export function usePurchaseInvoice(id = null) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastFetchedId = useRef(null);

    // 🔹 Fetch single invoice
    const fetchInvoice = useCallback(
        async (force = false) => {
            if (!id) return;
            if (!force && lastFetchedId.current === id) return;

            setLoading(true);
            setError(null);

            try {
                const res = await PurchaseInvoiceApi.getInvoiceById(id);

                if (res.success) {
                    // Backend always returns an array in `data`
                    const fetched = res.data?.[0] || null;
                    setInvoice(fetched);
                    lastFetchedId.current = id;
                } else {
                    setError(res.error || "Failed to fetch invoice");
                    if (res.error) toast.error(res.error);
                }
            } catch (err) {
                const msg = err.message || "Failed to fetch invoice";
                setError(msg);
                toast.error(`❌ ${msg}`);
            } finally {
                setLoading(false);
            }
        },
        [id]
    );

    // 🔹 Auto-fetch when `id` changes
    useEffect(() => {
        if (id) {
            fetchInvoice();
        } else {
            setInvoice(null);
            lastFetchedId.current = null;
        }
    }, [id, fetchInvoice]);

    // 🔹 Create invoice
    const createInvoice = async (payload) => {
        const res = await PurchaseInvoiceApi.createInvoice(payload);

        if (res.success) {
            toast.success(res.message || "✅ Purchase invoice created");
            // reset local invoice cache
            setInvoice(null);
            lastFetchedId.current = null;
        } else {
            toast.error(res.error || "❌ Failed to create invoice");
        }
        return res;
    };

    // 🔹 Update invoice (admin only)
    const updateInvoice = async (payload) => {
        if (!id) return { success: false, error: "Invoice ID is required" };

        const res = await PurchaseInvoiceApi.updateInvoice(id, payload);

        if (res.success) {
            toast.success(res.message || "✅ Purchase invoice updated");
            await fetchInvoice(true);
        } else {
            toast.error(res.error || "❌ Failed to update invoice");
        }
        return res;
    };

    // 🔹 Update payment status (user self-service)
    const updateStatus = async (newStatus) => {
        if (!id) return { success: false, error: "Invoice ID is required" };

        const res = await PurchaseInvoiceApi.updateInvoiceStatus(id, {
            paymentStatus: newStatus,
        });

        if (res.success) {
            toast.success(res.message || `✅ Status updated to ${newStatus}`);
            await fetchInvoice(true);
        } else {
            toast.error(res.error || "❌ Failed to update status");
        }
        return res;
    };

    // 🔹 Soft delete (deactivate)
    const deleteInvoice = async () => {
        if (!id) return { success: false, error: "Invoice ID is required" };

        const res = await PurchaseInvoiceApi.deleteInvoice(id);

        if (res.success) {
            toast.success(res.message || "✅ Invoice deactivated");
            setInvoice(null);
            lastFetchedId.current = null;
        } else {
            toast.error(res.error || "❌ Failed to deactivate invoice");
        }
        return res;
    };

    return {
        invoice,
        loading,
        error,
        refetch: () => fetchInvoice(true),
        createInvoice,
        updateInvoice,
        updateStatus,
        deleteInvoice,
    };
}
