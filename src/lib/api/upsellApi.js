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

// ✅ Update upsell
export async function updateUpsell(id, data) {
    const res = await axios.patch(`/upsell/${id}`, data);
    return res.data;
}

// Export all together for easy import
export const UpsellApi = {
    getUpsellsByBooking,
    createUpsell,
    updateUpsell,
};
