// src/hooks/useBookingDetails.js
import { useState, useCallback, useRef, useEffect } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";

export default function useBookingDetails() {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null);

    // keep track of allocated blob URLs so we can revoke on unmount
    const objectUrls = useRef([]);

    // ✅ safely create blob URL and track it
    const makeBlobUrl = (blob) => {
        const url = URL.createObjectURL(blob);
        objectUrls.current.push(url);
        return url;
    };

    // Fetch booking details + preload original photo (only once)
    const fetchDetails = useCallback(async (id) => {
        setLoading(true);
        setError("");
        try {
            const res = await BookingApi.getBookingById(id);
            if (res.ok) {
                setDetails(res.booking);

                // preload original only once
                if (!originalPhotoUrl) {
                    const photoRes = await BookingApi.getBookingPhoto(id, "original");
                    if (photoRes.ok && photoRes.blob) {
                        const url = makeBlobUrl(photoRes.blob);
                        setOriginalPhotoUrl(url);
                    }
                }
            } else {
                setError(res.error || "Failed to fetch booking details");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch booking details");
        } finally {
            setLoading(false);
        }
    }, [originalPhotoUrl]);

    // On-demand fetch (compressed or original)
    const fetchPhoto = useCallback(async (id, type = "original") => {
        const res = await BookingApi.getBookingPhoto(id, type);
        if (res.ok && res.blob) {
            const url = makeBlobUrl(res.blob);
            return { ok: true, url, blob: res.blob };
        }
        return res;
    }, []);

    // ✅ cleanup all blob URLs when hook unmounts
    useEffect(() => {
        return () => {
            objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrls.current = [];
        };
    }, []);

    return { details, loading, error, fetchDetails, fetchPhoto, originalPhotoUrl };
}
