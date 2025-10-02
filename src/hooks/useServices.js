// src/hooks/useServices.js
import { useEffect, useRef, useState } from "react";
import ServiceApi from "../lib/api/servicesApi.js"; // ✅ use the ServiceApi wrapper

// Simple in-memory cache (per app session)
const MEMO_CACHE = {
    list: null,  // [{ id, name }]
    map: null,   // { [id]: name }
    at: 0,
};
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function useServices({ enabled = true, useSessionCache = true } = {}) {
    const [list, setList] = useState(MEMO_CACHE.list || []);
    const [map, setMap] = useState(MEMO_CACHE.map || {});
    const [loading, setLoading] = useState(!MEMO_CACHE.list);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    useEffect(() => {
        // ✅ Try sessionStorage cache first
        if (useSessionCache && !MEMO_CACHE.list) {
            const raw = sessionStorage.getItem("svc_options_cache");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.at < TTL_MS) {
                        MEMO_CACHE.list = parsed.list;
                        MEMO_CACHE.map = parsed.map;
                        MEMO_CACHE.at = parsed.at;
                        setList(parsed.list);
                        setMap(parsed.map);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // ignore JSON parse errors
                }
            }
        }

        // ✅ Use memory cache if still valid
        if (MEMO_CACHE.list && Date.now() - MEMO_CACHE.at < TTL_MS) {
            setList(MEMO_CACHE.list);
            setMap(MEMO_CACHE.map);
            setLoading(false);
            return;
        }

        // ✅ Otherwise, fetch fresh
        (async () => {
            try {
                setLoading(true);
                setError("");

                const [listRes, mapRes] = await Promise.all([
                    ServiceApi.getServiceOptions({ enabled, format: "list" }), // { success, options }
                    ServiceApi.getServiceOptions({ enabled, format: "map" }),  // { success, options }
                ]);

                if (!mounted.current) return;

                if (!listRes.success || !mapRes.success) {
                    throw new Error(listRes.error || mapRes.error || "Failed to fetch services");
                }

                MEMO_CACHE.list = listRes.options;
                MEMO_CACHE.map = mapRes.options;
                MEMO_CACHE.at = Date.now();

                setList(listRes.options);
                setMap(mapRes.options);
                setLoading(false);

                if (useSessionCache) {
                    sessionStorage.setItem(
                        "svc_options_cache",
                        JSON.stringify({ list: listRes.options, map: mapRes.options, at: MEMO_CACHE.at })
                    );
                }
            } catch (e) {
                if (!mounted.current) return;
                setError(e.message || "Failed to load services");
                setLoading(false);
            }
        })();
    }, [enabled, useSessionCache]);

    // ✅ Helper to resolve service name by ID
    const getNameById = (id) => {
        if (!id) return "";
        return map?.[id] || "";
    };

    return {
        list,     // [{ id, name }]
        map,      // { id: name }
        getNameById, // ✅ resolves service name instantly
        loading,
        error,
        refresh: () => (MEMO_CACHE.at = 0), // invalidate cache
    };
}
