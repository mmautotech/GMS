// src/lib/api/UpsellApi.js
import axios from "./axiosInstance.js";

// ✅ Get all upsells for a specific booking
export async function getUpsellsByBooking(bookingId) {
    const res = await axios.get(`/upsell/booking/${bookingId}`);
    return res.data;
}

// ✅ Create upsell for a booking
export async function createUpsell(bookingId, data) {
    const res = await axios.post(`/upsell/booking/${bookingId}`, data);
    return res.data;
}

// ✅ Update upsell for a specific booking and upsell
export async function updateUpsell(bookingId, upsellId, data) {
    const res = await axios.put(`/upsell/booking/${bookingId}/upsell/${upsellId}`, data);
    return res.data;
}

// ✅ Get upsell photo
export async function getUpsellPhoto(bookingId, upsellId, type = "original") {
    const res = await axios.get(`/upsell/booking/${bookingId}/upsell/${upsellId}/photo?type=${type}`, {
        responseType: "blob", // to handle binary image data
    });
    return res.data;
}

// Export all together for easy import
export const UpsellApi = {
    getUpsellsByBooking,
    createUpsell,
    updateUpsell,
    getUpsellPhoto,
};
