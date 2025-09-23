// src/hooks/useServices.js
import { useEffect, useMemo, useRef, useState } from "react";
import { getServiceOptions } from "../lib/api/servicesApi";

// Simple in-memory cache (per app session)
const MEMO_CACHE = {
    list: null,      // [{id, name}]
    map: null,       // { [id]: name }
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
        // Try sessionStorage cache first (optional)
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
                } catch { }
            }
        }

        // In-memory cache fresh enough?
        if (MEMO_CACHE.list && Date.now() - MEMO_CACHE.at < TTL_MS) {
            setList(MEMO_CACHE.list);
            setMap(MEMO_CACHE.map);
            setLoading(false);
            return;
        }

        // Fetch once: ask backend for "list" and "map"
        (async () => {
            try {
                setLoading(true);
                setError("");

                const [listData, mapData] = await Promise.all([
                    getServiceOptions({ enabled, format: "list" }), // [{id,name}]
                    getServiceOptions({ enabled, format: "map" }),  // {id:name}
                ]);

                if (!mounted.current) return;

                MEMO_CACHE.list = listData;
                MEMO_CACHE.map = mapData;
                MEMO_CACHE.at = Date.now();

                setList(listData);
                setMap(mapData);
                setLoading(false);

                if (useSessionCache) {
                    sessionStorage.setItem(
                        "svc_options_cache",
                        JSON.stringify({ list: listData, map: mapData, at: MEMO_CACHE.at })
                    );
                }
            } catch (e) {
                if (!mounted.current) return;
                setError(e.message || "Failed to load services");
                setLoading(false);
            }
        })();
    }, [enabled, useSessionCache]);

    return { list, map, loading, error, refresh: () => (MEMO_CACHE.at = 0) };
}
