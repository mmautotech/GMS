// src/hooks/useParts.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";

import PartsApi from "../lib/api/partsApi.js";

export function useParts(initialParams = {}) {
    const [parts, setParts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // keep params stable between renders
    const paramsRef = useRef(params);

    const fetchParts = useCallback(
        async (overrideParams = {}) => {
            setLoading(true);
            setError(null);

            try {
                const mergedParams = { ...paramsRef.current, ...overrideParams };
                const res = await PartsApi.getParts(mergedParams);

                if (res.success) {
                    setParts(res.parts || []);
                    setMeta(res.meta || null);
                    setParams(mergedParams);
                    paramsRef.current = mergedParams;
                } else {
                    setError(res.error || "Failed to fetch parts");
                    toast.error(`❌ ${res.error || "Failed to fetch parts"}`);
                }
            } catch (err) {
                setError(err.message);
                toast.error(`❌ ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // fetch once on mount
    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    return {
        parts,
        meta,
        params,
        loading,
        error,
        refetch: fetchParts,
        setParams,
    };
}
