import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import ServiceApi from "../lib/api/serviceApi.js";

/**
 * Hook to fetch a single service by ID (with populated parts).
 * Always normalized to:
 * {
 *   _id, name, enabled, createdAt, updatedAt,
 *   parts: [{ _id, partName, isActive, label }],
 *   partsCount, label
 * }
 */
export default function useServiceById(serviceId) {
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(!!serviceId);
    const [error, setError] = useState("");

    const fetchService = useCallback(async (id = serviceId) => {
        if (!id) return;
        setLoading(true);
        setError("");

        try {
            const res = await ServiceApi.getServiceById(id);

            if (res.success && res.service) {
                setService(res.service);
            } else {
                const msg = res.error || "Failed to fetch service";
                setError(msg);
                setService(null);
                toast.error(`❌ ${msg}`);
            }
        } catch (err) {
            const msg = err.message || "Unexpected error";
            setError(msg);
            setService(null);
            toast.error(`❌ ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [serviceId]);

    // auto-fetch when id changes
    useEffect(() => {
        if (serviceId) fetchService(serviceId);
    }, [serviceId, fetchService]);

    return {
        service,     // full normalized service with populated parts
        loading,
        error,
        refresh: () => fetchService(serviceId), // manual refetch
    };
}
