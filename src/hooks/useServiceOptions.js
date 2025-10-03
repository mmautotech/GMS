// src/hooks/useServiceOptions.js
import { useEffect, useRef, useState, useCallback } from "react";
import ServiceApi from "../lib/api/serviceApi.js";

// 🔹 Cache structure: { [cacheKey]: { list, at } }
const MEMO_CACHE = {};
const TTL_MS = 60 * 1000; // 1 minute cache TTL

export default function useServiceOptions({
    enabled,
    format = "list",
    useSessionCache = true,
} = {}) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    const cacheKey = JSON.stringify({ enabled, format });

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    // ✅ Fetch service options
    const fetchOptions = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await ServiceApi.getServiceOptions({ enabled, format });
            if (!mounted.current) return;

            if (!res.success) throw new Error(res.error || "Failed to fetch service options");

            const options = res.options || [];

            // 🔹 Update memory cache
            MEMO_CACHE[cacheKey] = { list: options, at: Date.now() };
            setList(options);

            // 🔹 Optionally persist to sessionStorage
            if (useSessionCache) {
                sessionStorage.setItem(
                    `svc_options_cache_${cacheKey}`,
                    JSON.stringify({ list: options, at: Date.now() })
                );
            }
        } catch (err) {
            if (!mounted.current) return;
            setError(err.message || "Failed to load service options");
            setList([]);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [enabled, format, useSessionCache, cacheKey]);

    // ✅ Initial load (session cache → memory cache → API)
    useEffect(() => {
        // 1. Session cache
        if (useSessionCache) {
            const raw = sessionStorage.getItem(`svc_options_cache_${cacheKey}`);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.at < TTL_MS) {
                        setList(parsed.list || []);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // ignore parse errors
                }
            }
        }

        // 2. Memory cache
        const cached = MEMO_CACHE[cacheKey];
        if (cached && Date.now() - cached.at < TTL_MS) {
            setList(cached.list || []);
            setLoading(false);
            return;
        }

        // 3. Fetch from API
        fetchOptions();
    }, [cacheKey, useSessionCache, fetchOptions]);

    // ✅ Auto refresh every TTL
    useEffect(() => {
        const interval = setInterval(fetchOptions, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchOptions]);

    return {
        list,       // always normalized [{ id, name, label, value }]
        loading,
        error,
        refresh: fetchOptions, // manual refresh
    };
}
