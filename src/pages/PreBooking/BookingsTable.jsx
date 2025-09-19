// src/pages/PreBooking/BookingsTable.jsx
import React from "react";
import BookingRow from "./BookingRow.jsx";

export default function BookingsTable({
  bookings,
  onUpdate,
  onCarIn,
  onCancelled,
  onEdit,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
}) {

  const handleSort = (field) => {
    if (sortField === field) {
      // toggle asc/desc if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc"); // default ascending when changing field
    }
  };

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[900px]">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-1 cursor-pointer" onClick={() => handleSort("rowNumber")}>#</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("createdAt")}>
              Booking Date{renderSortArrow("createdAt")}
            </th>
            <th className="p-2">Landing Date</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("vehicleRegNo")}>
              Reg No
            </th>
            <th className="p-3">Phone Number</th>
            <th className="p-3">Post Code</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort("bookingPrice")}>
              Booking Price{renderSortArrow("bookingPrice")}
            </th>
            <th className="p-3">Created By</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <BookingRow
              key={booking._id}
              booking={booking}
              index={booking.rowNumber} // ✅ use backend rowNumber
              onUpdate={onUpdate}
              onCarIn={onCarIn}
              onCancelled={onCancelled}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
