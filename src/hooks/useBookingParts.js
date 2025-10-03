// src/hooks/useBookingParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import PartsApi from "../lib/api/partsApi.js";

// In-memory cache: { [bookingId]: { parts, at } }
const MEMO_CACHE = {};
const TTL_MS = 60 * 1000; // 1 minute

export default function useBookingParts(bookingId, { enabled = true } = {}) {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchParts = useCallback(async (force = false) => {
        if (!bookingId || !enabled) {
            setParts([]);
            return;
        }

        const cached = MEMO_CACHE[bookingId];
        if (!force && cached && Date.now() - cached.at < TTL_MS) {
            setParts(cached.parts || []);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await PartsApi.getPartsByBooking(bookingId);

            if (!mounted.current) return;

            if (res.success) {
                setParts(res.parts || []);
                MEMO_CACHE[bookingId] = { parts: res.parts || [], at: Date.now() };
            } else {
                const errMsg = res.error || "Failed to fetch booking parts";
                setError(errMsg);
                setParts([]);
            }
        } catch (err) {
            if (!mounted.current) return;
            setError(err.message || "Unexpected error fetching booking parts");
            setParts([]);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [bookingId, enabled]);

    // Auto-fetch when bookingId changes
    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    // Auto-refresh every 1 minute
    useEffect(() => {
        if (!bookingId) return;
        const interval = setInterval(() => {
            fetchParts(true);
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [bookingId, fetchParts]);

    return {
        parts,        // array of { _id, label }
        loading,
        error,
        refresh: () => fetchParts(true), // manual reload
    };
}
