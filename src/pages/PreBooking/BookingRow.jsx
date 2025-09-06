import React, { useState, useMemo, useEffect } from "react";
import BookingForm from "./BookingForm.jsx";
import Modal from "../../components/Modal.jsx";

export default function BookingRow({ booking: initialBooking, index, onUpdate, onCarIn, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [booking, setBooking] = useState(initialBooking);

  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  const formatValue = (val) => {
    if (!val) return "—";
    if (typeof val === "string" || typeof val === "number") return val;
    if (typeof val === "object") return val.name || val.label || JSON.stringify(val);
    return String(val);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const profit = (booking.bookingPrice || 0) - ((booking.labourCost || 0) + (booking.partsCost || 0));
  const profitPercent = booking.bookingPrice > 0 ? ((profit / booking.bookingPrice) * 100).toFixed(1) : "0.0";

  const servicesText = useMemo(() => {
    if (!booking.services) return "—";
    return booking.services
      .map((s) => (typeof s === "object" ? s.label || s.name || JSON.stringify(s) : s))
      .join(", ");
  }, [booking.services]);

  return (
    <>
      {/* Main Row */}
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="p-2 border">{index + 1}</td>
        <td className="p-3 border">{formatDate(booking.createdAt)}</td>
        <td className="p-3 border">{formatDate(booking.scheduledDate)}</td>
        <td className="p-2 border">{formatValue(booking.vehicleRegNo)}</td>
        <td className="p-2 border">{formatValue(booking.ownerNumber)}</td>
        <td className="p-2 border">{formatValue(booking.ownerPostalCode)}</td>
        <td className="p-2 border">{booking.bookingPrice?.toLocaleString() || 0}</td>
        <td className="p-2 border">{formatValue(booking.createdBy.username)}</td>
        <td className="p-2 flex gap-2 border">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition duration-200 ease-in-out flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); onCarIn(booking); }}
          >
            🚗 Car In
          </button>

          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition duration-200 ease-in-out flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
          >
            ✏️ Edit
          </button>
        </td>

      </tr>

      {/* Expanded Row */}
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={9} className="p-3">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">

                {/* Client & Vehicle */}
                <div className="p-4 rounded-md border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">👤 Client</p>
                  <p className="text-gray-900">{formatValue(booking.ownerName)}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase mt-3 mb-1">🚗 Make & Model</p>
                  <p className="text-gray-900">{formatValue(booking.makeModel)}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase mt-3 mb-1">🏠 Address</p>
                  <p className="text-gray-800">{formatValue(booking.ownerAddress)}</p>
                </div>

                {/* Costs & Profit */}
                <div className="p-4 rounded-md border border-blue-100 flex flex-col gap-3">
                  <p className="text-gray-500 text-xs font-bold uppercase">💰 Labour Cost</p>
                  <p className="text-green-600">£{booking.labourCost?.toLocaleString() || "0"}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase">🛠️ Parts Cost</p>
                  <p className="text-green-600">£{booking.partsCost?.toLocaleString() || "0"}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase">📊 Profit</p>
                  <p className="text-blue-600">£{profit.toLocaleString()} ({profitPercent}%)</p>
                </div>

                {/* Services & Remarks */}
                <div className="p-4 rounded-md border border-yellow-100">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">📝 Services</p>
                  <p className="text-gray-800 mb-3">{servicesText}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">💬 Remarks</p>
                  <p className="text-gray-800 mb-3">{formatValue(booking.remarks)}</p>

                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">🔗 Source</p>
                  <p className="text-gray-800">{formatValue(booking.source)}</p>
                </div>

              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <BookingForm
            initialData={booking}
            onCancel={() => setShowEditModal(false)}
            onSubmit={async ({ payload, reset }) => {
              const res = await onUpdate(booking._id, payload);
              if (res.ok) {
                setBooking({ ...booking, ...payload });
                reset?.();
                setShowEditModal(false);
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}
