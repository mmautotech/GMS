// src/hooks/useServiceOptions.js
import { useEffect, useRef, useState, useCallback } from "react";
import ServiceApi from "../lib/api/serviceApi.js";

// In-memory cache (separate from useServices)
const MEMO_CACHE = { list: [], at: 0 };
const TTL_MS = 60 * 1000; // 1 min cache TTL

export default function useServiceOptions({ enabled, format = "list", useSessionCache = true } = {}) {
    const [list, setList] = useState(MEMO_CACHE.list || []);
    const [loading, setLoading] = useState(!MEMO_CACHE.list.length);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchOptions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await ServiceApi.getServiceOptions({ enabled, format });

            if (!mounted.current) return;
            if (!res.success) throw new Error(res.error || "Failed to fetch service options");

            const options = res.options || [];

            // cache
            MEMO_CACHE.list = options;
            MEMO_CACHE.at = Date.now();

            setList(options);

            if (useSessionCache) {
                sessionStorage.setItem(
                    "svc_options_cache",
                    JSON.stringify({ list: options, at: Date.now() })
                );
            }
        } catch (e) {
            if (!mounted.current) return;
            setError(e.message || "Failed to load service options");
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [enabled, format, useSessionCache]);

    // --- Initial load with session cache
    useEffect(() => {
        if (useSessionCache && !MEMO_CACHE.list.length) {
            const raw = sessionStorage.getItem("svc_options_cache");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.at < TTL_MS) {
                        MEMO_CACHE.list = parsed.list || [];
                        MEMO_CACHE.at = parsed.at;
                        setList(MEMO_CACHE.list);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // ignore bad cache
                }
            }
        }

        if (MEMO_CACHE.list.length && Date.now() - MEMO_CACHE.at < TTL_MS) {
            setList(MEMO_CACHE.list);
            setLoading(false);
            return;
        }

        fetchOptions();
    }, [fetchOptions, useSessionCache]);

    // --- Auto refresh every 1 minute
    useEffect(() => {
        const interval = setInterval(fetchOptions, TTL_MS);
        return () => clearInterval(interval);
    }, [fetchOptions]);

    return {
        list,       // [{ id, name, label, value }]
        loading,
        error,
        refresh: fetchOptions,
    };
}
