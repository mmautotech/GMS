import { useEffect, useState, useCallback, useRef } from "react";
import { InvoiceApi } from "../lib/api/invoiceApi.js";
import { toast } from "react-toastify";

/**
 * 🎯 useInvoiceByBookingId Hook
 * Auto-fetches invoice by bookingId when enabled
 * - Shows toast feedback
 * - Retries automatically on transient errors
 * - Supports silent refresh to avoid duplicate toasts
 */
export function useInvoiceByBookingId(bookingId, enabled = true) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const retryCount = useRef(0);
    const toastId = useRef(null);

    const fetchInvoice = useCallback(
        async (opts = { silent: false }) => {
            if (!bookingId || !enabled) return;
            setLoading(true);
            setError(null);

            // Show toast only if not silent & not retrying
            if (!opts.silent && retryCount.current === 0) {
                toastId.current = toast.info("📦 Fetching invoice...", { autoClose: 1000 });
            }

            try {
                const data = await InvoiceApi.getInvoiceByBookingId(bookingId);
                setInvoice(data);
                if (!opts.silent)
                    toast.success(data ? "✅ Invoice loaded" : "ℹ️ No invoice found for this booking", {
                        autoClose: 1200,
                    });
                retryCount.current = 0; // reset retries
            } catch (err) {
                console.error("❌ Error fetching invoice:", err);
                setError(err.message || "Failed to fetch invoice");
                if (retryCount.current < 3) {
                    // Retry with backoff
                    const delay = 800 * Math.pow(2, retryCount.current);
                    retryCount.current += 1;
                    console.warn(`Retrying fetch (${retryCount.current}) in ${delay}ms...`);
                    setTimeout(() => fetchInvoice({ silent: true }), delay);
                } else {
                    toast.error("🚨 Could not fetch invoice after multiple attempts.");
                }
            } finally {
                setLoading(false);
            }
        },
        [bookingId, enabled]
    );

    // Run on mount or when bookingId changes
    useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    // 🧹 Cleanup to prevent state update after unmount
    useEffect(() => {
        return () => {
            if (toastId.current) toast.dismiss(toastId.current);
        };
    }, []);

    return {
        invoice,
        loading,
        error,
        refreshInvoice: (opts = { silent: true }) => fetchInvoice(opts),
    };
}
