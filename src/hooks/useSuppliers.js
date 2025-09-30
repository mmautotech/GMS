// src/hooks/useSuppliers.js
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

import { getSuppliers, getSupplierById } from "../lib/api/suppliersApi.js";

/**
 * Hook to fetch supplier list
 */
export function useSuppliers(initialParams = {}) {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // keep params stable in a ref
    const paramsRef = useRef(initialParams);

    const fetchSuppliers = useCallback(async (overrideParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            const mergedParams = { ...paramsRef.current, ...overrideParams };
            const res = await getSuppliers(mergedParams);

            setSuppliers(Array.isArray(res.data) ? res.data : []);
            paramsRef.current = mergedParams;
        } catch (err) {
            setError(err.message || "Failed to fetch suppliers");
            toast.error(`❌ ${err.message || "Failed to fetch suppliers"}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // fetch once on mount
    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    return { suppliers, loading, error, refetch: fetchSuppliers };
}

/**
 * Hook to fetch a single supplier by ID
 */
export function useSupplier(id) {
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getSupplierById(id);
                if (isMounted) {
                    setSupplier(res.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Failed to fetch supplier");
                    toast.error(`❌ ${err.message || "Failed to fetch supplier"}`);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [id]);

    return { supplier, loading, error };
}
