// src/hooks/useServices.js
import { useEffect, useRef, useState, useCallback } from "react";
import ServiceApi from "../lib/api/serviceApi.js";

// 🔹 In-memory cache
const MEMO_CACHE = {
    list: [],
    map: {},
    at: 0,
};
const TTL_MS = 60 * 1000; // 1 minute TTL

export default function useServices({ useSessionCache = true } = {}) {
    const [list, setList] = useState(MEMO_CACHE.list);
    const [map, setMap] = useState(MEMO_CACHE.map);
    const [loading, setLoading] = useState(!MEMO_CACHE.list.length);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    // ✅ Fetch services (from API, normalized in ServiceApi)
    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await ServiceApi.getServices();

            if (!mounted.current) return;
            if (!res.success) throw new Error(res.error || "Failed to fetch services");

            const services = res.services || [];

            // 🔹 Cache in-memory
            MEMO_CACHE.list = services;
            MEMO_CACHE.map = services.reduce((acc, s) => {
                acc[s._id] = {
                    name: s.name,
                    partsCount: s.partsCount ?? 0,
                    enabled: s.enabled,
                };
                return acc;
            }, {});
            MEMO_CACHE.at = Date.now();

            // 🔹 Update state
            setList(services);
            setMap(MEMO_CACHE.map);

            // 🔹 Optionally persist to sessionStorage
            if (useSessionCache) {
                sessionStorage.setItem(
                    "svc_cache",
                    JSON.stringify({
                        list: services,
                        map: MEMO_CACHE.map,
                        at: MEMO_CACHE.at,
                    })
                );
            }
        } catch (e) {
            if (!mounted.current) return;
            setError(e.message || "Failed to load services");
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [useSessionCache]);

    // ✅ Initial + cached load
    useEffect(() => {
        if (useSessionCache && !MEMO_CACHE.list.length) {
            const raw = sessionStorage.getItem("svc_cache");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.at < TTL_MS) {
                        MEMO_CACHE.list = parsed.list || [];
                        MEMO_CACHE.map = parsed.map || {};
                        MEMO_CACHE.at = parsed.at;
                        setList(MEMO_CACHE.list);
                        setMap(MEMO_CACHE.map);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // ignore parse errors
                }
            }
        }

        if (MEMO_CACHE.list.length && Date.now() - MEMO_CACHE.at < TTL_MS) {
            setList(MEMO_CACHE.list);
            setMap(MEMO_CACHE.map);
            setLoading(false);
            return;
        }

        fetchServices();
    }, [useSessionCache, fetchServices]);

    // ✅ Auto-refresh every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            fetchServices();
        }, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchServices]);

    // --- Helpers ---
    const getNameById = useCallback((id) => map?.[id]?.name || "", [map]);
    const getPartsCountById = useCallback((id) => map?.[id]?.partsCount ?? 0, [map]);
    const isEnabledById = useCallback((id) => map?.[id]?.enabled ?? false, [map]);

    const refresh = useCallback(() => {
        MEMO_CACHE.at = 0; // bust cache
        fetchServices();
    }, [fetchServices]);

    return {
        list,       // full normalized services [{ _id, name, enabled, parts, partsCount, createdAt, updatedAt }]
        map,        // { _id: { name, partsCount, enabled } }
        getNameById,
        getPartsCountById,
        isEnabledById,
        loading,
        error,
        refresh,
    };
}
