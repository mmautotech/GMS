// src/hooks/useBookingMap.js
import { useEffect, useState } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

export function useBookingMap() {
    const [map, setMap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        BookingApi.getBookingIdMap()
            .then((res) => {
                if (mounted && res.ok) {
                    setMap(res.items || []);
                } else if (mounted) {
                    setError(res.error || "Failed to load booking map");
                }
            })
            .catch((err) => {
                if (mounted) setError(err.message || "Failed to load booking map");
            })
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);

    return { map, loading, error };
}
