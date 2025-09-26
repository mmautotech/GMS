import axios from "./axiosInstance.js";

// 🔧 Normalize date to YYYY-MM-DD
const normalizeDate = (val) => {
  if (!val) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return new Date(val).toISOString().split("T")[0];
};

export const BookingApi = {
  // --- List bookings with pagination + filters ---
  getBookings: async ({
    status,
    fromDate,
    toDate,
    search,
    services,
    page = 1,
    limit = 25,
    sortBy = "createdDate",
    sortDir,
  } = {}) => {
    try {
      const params = { page, limit, sortBy };
      if (typeof sortDir !== "undefined") params.sortDir = sortDir;
      if (status) params.status = String(status).toLowerCase();
      if (fromDate) params.fromDate = normalizeDate(fromDate);
      if (toDate) params.toDate = normalizeDate(toDate);
      if (search) params.search = search.trim();
      if (services) params.services = services;

      const res = await axios.get("/bookings", { params });
      const data = res.data || {};

      return {
        ok: data.success ?? true,
        items: data.data || [],
        pagination: data.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        meta: data.meta || {},
        params: data.params || null,
      };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch bookings",
      };
    }
  },

  // --- Export bookings as CSV ---
  exportBookings: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append("status", String(filters.status).toLowerCase());
      if (filters.fromDate) params.append("fromDate", normalizeDate(filters.fromDate));
      if (filters.toDate) params.append("toDate", normalizeDate(filters.toDate));
      if (filters.search) params.append("search", filters.search.trim());
      if (filters.services) params.append("services", filters.services);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (typeof filters.sortDir !== "undefined") params.append("sortDir", filters.sortDir);

      const res = await axios.get(`/bookings/export?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bookings_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to export bookings",
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
      if (!id) throw new Error("Booking ID is required");
      if (!payload || Object.keys(payload).length === 0) {
        throw new Error("At least one field must be provided for update");
      }

      const res = await axios.put(`/bookings/${id}`, payload);
      const data = res.data || {};

      return {
        ok: true,
        booking: data.booking || data.data || null, // flexible mapping
        message: data.message || "Booking updated successfully",
      };
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
      const payload = { status: String(status).toLowerCase() };
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


  // --- List pending bookings ---
  getPendingBookings: async ({
    fromDate,
    toDate,
    search,
    services,
    user,
    page = 1,
    limit = 25,
    sortBy = "createdDate",
    sortDir = "desc",
  } = {}) => {
    try {
      const params = { page, limit, sortBy, sortDir };
      if (fromDate) params.fromDate = normalizeDate(fromDate);
      if (toDate) params.toDate = normalizeDate(toDate);
      if (search) params.search = search.trim();
      if (services) params.services = services;
      if (user) params.user = user;

      const res = await axios.get("/bookings/pending", { params });
      const data = res.data || {};

      return {
        ok: data.success ?? true,
        items: data.data || [],
        pagination: data.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        params: data.params || null,
      };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch pending bookings",
      };
    }
  },

  // --- NEW: List arrived bookings ---
  getArrivedBookings: async ({
    fromDate,
    toDate,
    search,
    services,
    page = 1,
    limit = 25,
    sortBy = "arrivedAt",
    sortDir,
  } = {}) => {
    try {
      const params = { page, limit, sortBy };
      if (typeof sortDir !== "undefined") params.sortDir = sortDir;
      if (fromDate) params.fromDate = normalizeDate(fromDate);
      if (toDate) params.toDate = normalizeDate(toDate);
      if (search) params.search = search.trim();
      if (services) params.services = services;

      const res = await axios.get("/bookings/arrived", { params });
      const data = res.data || {};

      return {
        ok: data.success ?? true,
        items: data.data || [],
        pagination: data.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        meta: data.meta || {},
        params: data.params || null,
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err.message ||
          "Failed to fetch arrived bookings",
      };
    }
  },

  // --- Get single booking ---
  getBookingById: async (id) => {
    try {
      const res = await axios.get(`/bookings/${id}`);
      const data = res.data || {};
      return { ok: true, booking: data.data || null };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch booking",
      };
    }
  },

  // --- Get booking photo (original or compressed) ---
  getBookingPhoto: async (id, type = "original") => {
    try {
      const res = await axios.get(`/bookings/${id}/photo?type=${type}`, {
        responseType: "blob", // raw binary
      });

      const blob = res.data;
      const url = URL.createObjectURL(blob); // ✅ always generate a blob URL

      return { ok: true, blob, url };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err.message || "Failed to fetch booking photo",
      };
    }
  },
};
