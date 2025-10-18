// src/hooks/useBookingDetails.js
import { useState, useCallback, useRef, useEffect } from "react";
import { BookingApi } from "../lib/api/bookingApi.js";
import { UpsellApi } from "../lib/api/UpsellApi.js";

export default function useBookingDetails() {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const objectUrls = useRef([]);
    const [bookingPhotoUrl, setBookingPhotoUrl] = useState(null);
    const [upsellPhotoUrls, setUpsellPhotoUrls] = useState({});

    const currentBookingId = useRef(null);
    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
            // Cleanup all object URLs on unmount
            objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrls.current = [];
        };
    }, []);

    const makeBlobUrl = (blob) => {
        const url = URL.createObjectURL(blob);
        objectUrls.current.push(url);
        return url;
    };

    // --------------------------
    // Booking confirmation photo
    // --------------------------
    const fetchBookingPhoto = useCallback(async (bookingId, type = "original") => {
        try {
            const blob = await BookingApi.getBookingPhoto(bookingId, type);
            if (blob && mounted.current) {
                const url = makeBlobUrl(blob);
                setBookingPhotoUrl(url);
                return url;
            }
        } catch (err) {
            console.error("Failed to fetch booking photo", err);
        }
        return null;
    }, []);

    // Fetch original photo on-demand (for click/open)
    const fetchOriginalBookingPhoto = useCallback(async () => {
        if (!currentBookingId.current) return null;
        try {
            const url = await fetchBookingPhoto(currentBookingId.current, "original");
            return url;
        } catch (err) {
            console.error("Failed to fetch original booking photo", err);
            return null;
        }
    }, [fetchBookingPhoto]);

    // --------------------------
    // Upsell photos
    // --------------------------
    const fetchUpsellPhoto = useCallback(async (bookingId, upsellId) => {
        try {
            const blob = await UpsellApi.getUpsellPhoto(bookingId, upsellId, "original");
            if (blob && mounted.current) {
                const url = makeBlobUrl(blob);
                setUpsellPhotoUrls((prev) => ({ ...prev, [upsellId]: url }));
                return url;
            }
        } catch (err) {
            console.error("Failed to fetch upsell photo", err);
        }
        return null;
    }, []);

    // --------------------------
    // Fetch booking details
    // --------------------------
    const fetchDetails = useCallback(
        async (bookingId) => {
            currentBookingId.current = bookingId;
            setLoading(true);
            setError("");

            try {
                // Fetch booking
                const bookingRes = await BookingApi.getBookingById(bookingId);
                const bookingData = bookingRes.ok ? bookingRes.booking : null;

                // Fetch upsells / prebooking data
                const upsellRes = await UpsellApi.getUpsellsByBooking(bookingId);
                const prebooking = upsellRes && upsellRes.success ? upsellRes : {};

                const bookingPrice = prebooking.prebookingBookingPrice || 0;
                const labourCost = prebooking.prebookingLabourCost || 0;
                const partsCost = prebooking.prebookingPartsCost || 0;
                const profit = bookingPrice - labourCost - partsCost;
                const profitPercent = bookingPrice
                    ? Math.round((profit / bookingPrice) * 100)
                    : 0;

                const bookingDetails = {
                    ...bookingData,
                    bookingPrice,
                    labourCost,
                    partsCost,
                    profit,
                    profitPercent,
                    services: prebooking.prebookingServices || [],
                    ownerAddress:
                        prebooking.ownerAddress || bookingData?.ownerAddress || "",
                    remarks: prebooking.remarks || bookingData?.remarks || "",
                    source: prebooking.source || bookingData?.source || "",
                    compressedPhoto:
                        prebooking.compressedPhoto || bookingData?.compressedPhoto || null,
                    upsells: prebooking.upsells || [],
                };

                if (!mounted.current) return;

                setDetails(bookingDetails);

                // --------------------------
                // Set booking photo
                // --------------------------
                if (bookingDetails.compressedPhoto) {
                    const url =
                        typeof bookingDetails.compressedPhoto === "string"
                            ? bookingDetails.compressedPhoto
                            : makeBlobUrl(bookingDetails.compressedPhoto);
                    setBookingPhotoUrl(url);
                } else {
                    // fallback: fetch original from API
                    await fetchBookingPhoto(bookingId, "original");
                }

                // Fetch upsell photos in parallel
                await Promise.all(
                    bookingDetails.upsells.map((upsell) =>
                        fetchUpsellPhoto(bookingId, upsell._id)
                    )
                );

                return bookingDetails;
            } catch (err) {
                if (!mounted.current) return;
                setError(err.message || "Failed to fetch booking details");
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        [fetchBookingPhoto, fetchUpsellPhoto]
    );

    // --------------------------
    // Add a new upsell
    // --------------------------
    const addUpsell = useCallback(
        async (bookingId, upsellData) => {
            try {
                const res = await UpsellApi.createUpsell(bookingId, upsellData);
                if (res && res.success && mounted.current) {
                    const newUpsell = res.booking?.upsells?.slice(-1)[0]; // get last created
                    setDetails((prev) => ({
                        ...prev,
                        upsells: [...(prev?.upsells || []), newUpsell],
                    }));
                    await fetchUpsellPhoto(bookingId, newUpsell._id);
                    return newUpsell;
                }
            } catch (err) {
                console.error("Failed to add upsell", err);
                if (mounted.current) setError(err.message || "Failed to add upsell");
            }
            return null;
        },
        [fetchUpsellPhoto]
    );

    // --------------------------
    // Auto-refresh every 1 minute
    // --------------------------
    const refresh = useCallback(async () => {
        if (currentBookingId.current) {
            await fetchDetails(currentBookingId.current);
        }
    }, [fetchDetails]);

    useEffect(() => {
        const interval = setInterval(refresh, 60000);
        return () => clearInterval(interval);
    }, [refresh]);

    return {
        details,
        loading,
        error,
        fetchDetails,
        bookingPhotoUrl,
        upsellPhotoUrls,
        fetchBookingPhoto,
        fetchUpsellPhoto,
        fetchOriginalBookingPhoto,
        addUpsell,
        refresh,
    };
}
