import React, { useState, useCallback } from "react";
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

  const {
    list: bookings,
    loadingList,
    saving,
    create,
    update,
    updateStatus,
    page,
    setPage,
    totalPages,
    totalItems,
    refresh, // <-- refresh function from hook
  } = useBookings({ status: "pending", pageSize: 20 });

  const handleUpdate = useCallback(
    async (id, payload) => {
      const res = await update(id, payload);
      if (!res.ok) {
        toast.error(res.error || "Failed to update booking");
        return res;
      }
      // refresh bookings list after successful update
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
          refresh(); // <-- refresh list
        } else toast.error(res.error || "Failed to update booking");
      } else {
        const res = await create(payload);
        if (res.ok) {
          toast.success("Booking created successfully!");
          reset?.();
          setShowModal(false);
          refresh(); // <-- refresh list
        } else toast.error(res.error || "Failed to create booking");
      }
    },
    [create, update, editingBooking, refresh]
  );

  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 drop-shadow-sm">
        Pre-Booking
      </h1>

      {loadingList ? (
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 flex items-center justify-center gap-3">
          <InlineSpinner />
          <span className="text-gray-500 text-lg">Loading bookings…</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md shadow-sm">
          No pending bookings found. Click <strong>+</strong> to add a new booking.
        </div>
      ) : (
        <BookingsTable
          bookings={bookings}
          onUpdate={handleUpdate}
          onCarIn={handleCarIn}
          onEdit={handleEditBooking}
        />
      )}

      <button
        onClick={handleAddBooking}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white w-16 h-16 rounded-full text-4xl font-bold flex items-center justify-center shadow-xl transition-transform hover:scale-110"
        title="Add New Booking"
      >
        +
      </button>

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
