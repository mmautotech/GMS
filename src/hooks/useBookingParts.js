// src/hooks/useBookingParts.js
import { useState, useEffect, useCallback } from "react";
import PartsApi from "../lib/api/partsApi.js";

export default function useBookingParts(bookingId, { enabled = true } = {}) {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchParts = useCallback(async () => {
        if (!bookingId || !enabled) {
            setParts([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await PartsApi.getPartsByBooking(bookingId);
            if (res.success) {
                // backend already mapped → { _id, label }
                setParts(res.parts || []);
            } else {
                setError(res.error || "Failed to fetch booking parts");
                setParts([]);
            }
        } catch (err) {
            setError(err.message || "Unexpected error fetching booking parts");
            setParts([]);
        } finally {
            setLoading(false);
        }
    }, [bookingId, enabled]);

    // Auto-fetch when bookingId changes
    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    return {
        parts,        // array of { _id, label }
        loading,
        error,
        refresh: fetchParts, // manual reload
    };
}
