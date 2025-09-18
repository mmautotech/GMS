// src/lib/api/bookingApi.js
import axios from "./axiosInstance.js";

export const BookingApi = {
  // --- List bookings with pagination + filters ---
  getBookings: async ({
    status,
    carRegNo,
    clientName,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortDir = "desc",
  } = {}) => {
    try {
      // Build query params for backend
      const params = { status, page, limit, sortBy, sortDir };
      if (carRegNo) params.carRegNo = carRegNo;
      if (clientName) params.clientName = clientName;

      const res = await axios.get("/bookings", { params });
      const data = res.data || {};

      return {
        ok: data.success ?? true,
        items: data.data || [],
        totalItems: data.pagination?.total ?? (data.data?.length || 0),
        page: data.pagination?.page ?? 1,
        limit: data.pagination?.limit ?? limit,
        totalPages: data.pagination?.totalPages ?? 1,
        hasNextPage: data.pagination?.hasNextPage ?? false,
        hasPrevPage: data.pagination?.hasPrevPage ?? false,
      };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch bookings",
      };
    }
  },

  // --- Get single booking ---
  getBookingById: async (id) => {
    try {
      const res = await axios.get(`/bookings/${id}`);
      const data = res.data || {};
      return { ok: true, booking: data.booking || data };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch booking",
      };
    }
  },

  // --- Create booking ---
  createBooking: async (payload) => {
    try {
      const res = await axios.post("/bookings", payload);
      const data = res.data || {};
      return { ok: true, booking: data.booking || data };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to create booking",
      };
    }
  },

  // --- Update booking ---
  updateBooking: async (id, payload) => {
    try {
      if (!id || !payload) throw new Error("Booking ID and payload are required");
      const res = await axios.put(`/bookings/${id}`, payload);
      const data = res.data || {};
      return { ok: true, booking: data.booking || data };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to update booking",
      };
    }
  },

  // --- Update booking status ---
  updateBookingStatus: async (id, status) => {
    try {
      if (!id || !status) throw new Error("Booking ID and status are required");
      const payload = { status: String(status) };
      const res = await axios.patch(`/bookings/status/${id}`, payload);
      const data = res.data || {};
      return { ok: true, booking: data.booking || data };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to update booking status",
      };
    }
  },
};
