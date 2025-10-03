import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-refresh wrapper for any async function that requires an ID.
 *
 * @param {Function} fetchFn - async function that takes an id
 * @param {number} interval - refresh interval in ms
 * @returns {Object} { setCurrentId } - function to update the current ID
 */
export default function useAutoRefreshWithId(fetchFn, interval = 60000) {
    const currentId = useRef(null);

    // Set the ID to refresh
    const setCurrentId = useCallback((id) => {
        currentId.current = id;
    }, []);

    const tick = useCallback(async () => {
        if (currentId.current) {
            await fetchFn(currentId.current);
        }
    }, [fetchFn]);

    useEffect(() => {
        // First call immediately
        tick();
        const intervalId = setInterval(tick, interval);
        return () => clearInterval(intervalId);
    }, [tick, interval]);

    return { setCurrentId };
}
