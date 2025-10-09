// src/hooks/useServices.js
import { useEffect, useRef, useState, useCallback } from "react";
import ServiceApi from "../lib/api/serviceApi.js";

export default function useServices() {
    const [list, setList] = useState([]);
    const [map, setMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    // ✅ Fetch services directly (no cache to avoid stale data)
    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await ServiceApi.getServices();
            console.log("🧠 [useServices] API response:", res);

            if (!mounted.current) return;
            if (!res.success) throw new Error(res.error || "Failed to fetch services");

            const services = res.services || [];

            // 🔹 Prepare map for quick lookups
            const serviceMap = services.reduce((acc, s) => {
                acc[s._id] = {
                    name: s.name,
                    partsCount: s.partsCount ?? 0,
                    enabled: s.enabled,
                };
                return acc;
            }, {});

            setList(services);
            setMap(serviceMap);
        } catch (e) {
            if (!mounted.current) return;
            console.error("🚨 [useServices] Error fetching services:", e);
            setError(e.message || "Failed to load services");
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    // ✅ Initial load (always fetch fresh)
    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // ✅ Manual refresh
    const refresh = useCallback(() => {
        console.log("🔁 [useServices] Manual refresh triggered");
        fetchServices();
    }, [fetchServices]);

    // --- Helpers ---
    const getNameById = useCallback((id) => map?.[id]?.name || "", [map]);
    const getPartsCountById = useCallback((id) => map?.[id]?.partsCount ?? 0, [map]);
    const isEnabledById = useCallback((id) => map?.[id]?.enabled ?? false, [map]);

    return {
        list,       // [{ _id, name, enabled, partsCount, createdAt, updatedAt }]
        map,        // { _id: { name, partsCount, enabled } }
        getNameById,
        getPartsCountById,
        isEnabledById,
        loading,
        error,
        refresh,
    };
}
