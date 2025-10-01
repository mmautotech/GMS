import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";

import PartsApi from "../lib/api/partsApi.js";

export function useParts(initialParams = {}) {
    const [parts, setParts] = useState([]);
    const [meta, setMeta] = useState({
        totalParts: 0,
        activeParts: 0,
        inactiveParts: 0,
    });
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // keep params stable between renders
    const paramsRef = useRef(initialParams);

    const fetchParts = useCallback(
        async (overrideParams = {}) => {
            setLoading(true);
            setError(null);

            try {
                const mergedParams = { ...paramsRef.current, ...overrideParams };
                const res = await PartsApi.getParts(mergedParams);

                if (res.success) {
                    setParts(res.parts || []);
                    setMeta(res.meta || {
                        totalParts: 0,
                        activeParts: 0,
                        inactiveParts: 0,
                    });
                    setParams(mergedParams);
                    paramsRef.current = mergedParams;
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
        []
    );

    // fetch once on mount
    useEffect(() => {
        fetchParts(initialParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        parts,       // list of parts
        meta,        // { totalParts, activeParts, inactiveParts }
        params,      // current query params
        loading,     // true while fetching
        error,       // last error
        refetch: fetchParts,
        setParams: (newParams) => {
            paramsRef.current = { ...paramsRef.current, ...newParams };
            setParams(paramsRef.current);
        },
    };
}
