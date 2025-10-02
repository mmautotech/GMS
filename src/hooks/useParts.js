// src/hooks/useParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PartsApi from "../lib/api/partsApi.js";

export function useParts(initialParams = {}, bookingId = null) {
    const [parts, setParts] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsRef = useRef(initialParams);

    // ✅ Single unified fetcher
    const fetchParts = useCallback(
        async (overrideParams = {}) => {
            setLoading(true);
            setError(null);

            try {
                let res;
                if (bookingId) {
                    // 🔹 Fetch parts for a specific booking
                    res = await PartsApi.getPartsByBooking(bookingId);
                } else {
                    // 🔹 Fetch general active parts (supports q param)
                    const mergedParams = { ...paramsRef.current, ...overrideParams };
                    res = await PartsApi.getParts(mergedParams);
                    if (res.success) {
                        setParams(mergedParams);
                        paramsRef.current = mergedParams;
                    }
                }

                if (res.success) {
                    // 🔹 Already normalized in partsApi
                    setParts(res.parts || []);
                } else {
                    const errMsg = res.error || "Failed to fetch parts";
                    setError(errMsg);
                    toast.error(`❌ ${errMsg}`);
                }
            } catch (err) {
                setError(err.message);
                toast.error(`❌ ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        [bookingId]
    );

    // ✅ Refetch on mount / bookingId change
    useEffect(() => {
        fetchParts(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    return {
        parts,      // normalized { _id, label, partName?, partNumber? }
        params,
        loading,
        error,
        refetch: fetchParts,
        setParams: (newParams) => {
            paramsRef.current = { ...paramsRef.current, ...newParams };
            setParams(paramsRef.current);
        },
    };
}
