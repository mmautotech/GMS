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

    // Create and track blob URLs
    const makeBlobUrl = (blob) => {
        const url = URL.createObjectURL(blob);
        objectUrls.current.push(url);
        return url;
    };

    // Fetch booking photo
    const fetchBookingPhoto = useCallback(async (bookingId) => {
        try {
            const res = await BookingApi.getBookingPhoto(bookingId, "original");
            if (res.ok && res.blob) {
                const url = makeBlobUrl(res.blob);
                setBookingPhotoUrl(url);
                return url;
            }
        } catch (err) {
            console.error("Failed to fetch booking photo", err);
        }
        return null;
    }, []);

    // Fetch upsell photo
    const fetchUpsellPhoto = useCallback(async (bookingId, upsellId) => {
        try {
            const res = await UpsellApi.getUpsellPhoto(bookingId, upsellId, "original");
            if (res) {
                const blob = res instanceof Blob ? res : new Blob([res], { type: "image/png" });
                const url = makeBlobUrl(blob);
                setUpsellPhotoUrls((prev) => ({ ...prev, [upsellId]: url }));
                return url;
            }
        } catch (err) {
            console.error("Failed to fetch upsell photo", err);
        }
        return null;
    }, []);

    // Fetch booking details + prebooking + upsells
    const fetchDetails = useCallback(async (bookingId) => {
        setLoading(true);
        setError("");
        try {
            // 1️⃣ Fetch main booking details
            const bookingRes = await BookingApi.getBookingById(bookingId);
            const bookingData = bookingRes.ok ? bookingRes.booking : null;

            // 2️⃣ Fetch upsells & prebooking info
            const upsellRes = await UpsellApi.getUpsellsByBooking(bookingId);

            const prebooking = upsellRes && upsellRes.success ? upsellRes : {};
            const bookingPrice = prebooking.prebookingBookingPrice || 0;
            const labourCost = prebooking.prebookingLabourCost || 0;
            const partsCost = prebooking.prebookingPartsCost || 0;
            const profit = bookingPrice - labourCost - partsCost;
            const profitPercent = bookingPrice ? Math.round((profit / bookingPrice) * 100) : 0;

            const bookingDetails = {
                ...bookingData,
                bookingPrice,
                labourCost,
                partsCost,
                profit,
                profitPercent,
                services: prebooking.prebookingServices || [],
                ownerAddress: prebooking.ownerAddress || bookingData?.ownerAddress || "",
                remarks: prebooking.remarks || bookingData?.remarks || "",
                source: prebooking.source || bookingData?.source || "",
                compressedPhoto: prebooking.compressedPhoto || bookingData?.compressedPhoto || null,
                upsells: prebooking.upsells || [],
            };

            setDetails(bookingDetails);

            // 3️⃣ Preload booking photo
            if (bookingDetails.compressedPhoto) {
                setBookingPhotoUrl(bookingDetails.compressedPhoto);
            } else {
                await fetchBookingPhoto(bookingId);
            }

            // 4️⃣ Preload upsell photos
            for (let upsell of bookingDetails.upsells) {
                await fetchUpsellPhoto(bookingId, upsell._id);
            }

            return bookingDetails;
        } catch (err) {
            setError(err.message || "Failed to fetch booking details");
        } finally {
            setLoading(false);
        }
    }, [fetchBookingPhoto, fetchUpsellPhoto]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrls.current = [];
        };
    }, []);

    return {
        details,
        loading,
        error,
        fetchDetails,
        bookingPhotoUrl,
        upsellPhotoUrls,
        fetchBookingPhoto,
        fetchUpsellPhoto,
    };
}
