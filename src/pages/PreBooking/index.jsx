// src/pages/PreBooking/PreBookingPage.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useBookings from "../../hooks/useBookings.js";
import BookingsTable from "./BookingsTable.jsx";
import BookingForm from "./BookingForm.jsx";
import { toast } from "react-toastify";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import Modal from "../../components/Modal.jsx";

export default function PreBookingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("createdAt"); // 'createdAt' or 'bookingPrice'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  const {
    list: bookings,
    loadingList,
    saving,
    create,
    update,
    updateStatus,
    refresh,
  } = useBookings({ status: "pending", pageSize: 1000 }); // Load all for frontend sorting

  const handleUpdate = useCallback(
    async (id, payload) => {
      const res = await update(id, payload);
      if (!res.ok) {
        toast.error(res.error || "Failed to update booking");
        return res;
      }
      refresh();
      return res;
    },
    [update, refresh]
  );

  const handleCarIn = useCallback(
    async (booking) => {
      const res = await updateStatus(booking._id, "arrived");
      if (res.ok) {
        toast.success("Car marked as arrived!");
        refresh();
        navigate("/car-in");
      } else toast.error(res.error || "Failed to mark car as arrived");
    },
    [updateStatus, navigate, refresh]
  );

  const handleAddBooking = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowModal(true);
  };

  const handleFormSubmit = useCallback(
    async ({ payload, reset, error: errMsg }) => {
      if (errMsg) return toast.error(errMsg);

      if (editingBooking) {
        const res = await update(editingBooking._id, payload);
        if (res.ok) {
          toast.success("Booking updated successfully!");
          reset?.();
          setShowModal(false);
          setEditingBooking(null);
          refresh();
        } else toast.error(res.error || "Failed to update booking");
      } else {
        const res = await create(payload);
        if (res.ok) {
          toast.success("Booking created successfully!");
          reset?.();
          setShowModal(false);
          refresh();
        } else toast.error(res.error || "Failed to create booking");
      }
    },
    [create, update, editingBooking, refresh]
  );

  // --- Filter & Search + Frontend Sorting ---
  const filteredBookings = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = bookings.filter(
      (b) =>
        b.ownerName?.toLowerCase().includes(term) ||
        b.ownerEmail?.toLowerCase().includes(term) ||
        b.vehicleRegNo?.toLowerCase().includes(term) ||
        b.makeModel?.toLowerCase().includes(term) ||
        b.ownerPostalCode?.toLowerCase().includes(term) // added postal code
    );

    return filtered.sort((a, b) => {
      if (sortField === "bookingPrice") {
        const priceA = Number(a.bookingPrice) || 0;
        const priceB = Number(b.bookingPrice) || 0;
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      } else if (sortField === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [bookings, searchTerm, sortField, sortOrder]);

  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 drop-shadow-sm">
        Pre-Booking
      </h1>

      {/* Search & Sorting */}
      <div className="bg-white p-4 mb-6 rounded-lg shadow flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by name, email, reg no, model, or post code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="bookingPrice">Sort by Price</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Booking Table */}
      {loadingList ? (
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 flex items-center justify-center gap-3">
          <InlineSpinner />
          <span className="text-gray-500 text-lg">Loading bookings…</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md shadow-sm">
          No bookings found matching your criteria.
        </div>
      ) : (
        <BookingsTable
          bookings={filteredBookings}
          onUpdate={handleUpdate}
          onCarIn={handleCarIn}
          onEdit={handleEditBooking}
        />
      )}

      {/* Floating Add Button */}
      <button
        onClick={handleAddBooking}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white w-16 h-16 rounded-full text-4xl font-bold flex items-center justify-center shadow-xl transition-transform hover:scale-110"
        title="Add New Booking"
      >
        +
      </button>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <BookingForm
          loading={saving}
          initialData={editingBooking}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
