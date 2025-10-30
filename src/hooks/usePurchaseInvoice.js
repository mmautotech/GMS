import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PurchaseInvoiceApi from "../lib/api/purchaseInvoiceApi.js";

// Simple in-memory cache: { [invoiceId]: { data, at } }
const MEMO_CACHE = {};
const TTL_MS = 40 * 1000; // 1 minute

export function usePurchaseInvoice(id = null) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchInvoice = useCallback(
        async (force = false) => {
            if (!id) return;

            const cacheKey = `invoice-${id}`;
            const cached = MEMO_CACHE[cacheKey];

            if (!force && cached && Date.now() - cached.at < TTL_MS) {
                setInvoice(cached.data || null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await PurchaseInvoiceApi.getInvoiceById(id);

                if (!mounted.current) return;

                if (res.success) {
                    const fetched = res.data?.[0] || null;
                    setInvoice(fetched);
                    MEMO_CACHE[cacheKey] = { data: fetched, at: Date.now() };
                } else {
                    setError(res.error || "Failed to fetch invoice");
                    if (res.error) toast.error(res.error);
                }
            } catch (err) {
                if (!mounted.current) return;
                const msg = err.message || "Failed to fetch invoice";
                setError(msg);
                toast.error(`❌ ${msg}`);
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        [id]
    );

    // Auto-fetch on id change
    useEffect(() => {
        if (id) {
            fetchInvoice();
        } else {
            setInvoice(null);
        }
    }, [id, fetchInvoice]);

    // Auto-refresh every 1 minute
    useEffect(() => {
        if (!id) return;
        const interval = setInterval(() => {
            fetchInvoice(true);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [id, fetchInvoice]);

    const createInvoice = async (payload) => {
        const res = await PurchaseInvoiceApi.createInvoice(payload);
        if (res.success) {
            toast.success(res.message || "✅ Purchase invoice created");
            if (id) MEMO_CACHE[`invoice-${id}`] = { data: null, at: 0 };
            setInvoice(null);
        } else {
            toast.error(res.error || "❌ Failed to create invoice");
        }
        return res;
    };

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

    const deleteInvoice = async () => {
        if (!id) return { success: false, error: "Invoice ID is required" };
        const res = await PurchaseInvoiceApi.deleteInvoice(id);
        if (res.success) {
            toast.success(res.message || "✅ Invoice deactivated");
            setInvoice(null);
            MEMO_CACHE[`invoice-${id}`] = { data: null, at: 0 };
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
