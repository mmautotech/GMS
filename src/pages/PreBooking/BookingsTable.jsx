import React, { useMemo } from "react";
import BookingRow from "./BookingRow.jsx";

export default function BookingsTable({ bookings, onUpdate, onCarIn, onEdit }) {
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings]);

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[900px]">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-1">#</th>
            <th className="p-2">Booking Date</th>
            <th className="p-2">Landing Date</th>
            <th className="p-2">Reg No</th>
            <th className="p-3">Phone Number</th>
            <th className="p-3">Post Code</th>
            <th className="p-3">Booking Price</th>
            <th className="p-3">Created By</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedBookings.map((booking, idx) => (
            <BookingRow
              key={booking._id || idx}
              booking={booking}
              index={idx}
              onUpdate={onUpdate}
              onCarIn={onCarIn}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
