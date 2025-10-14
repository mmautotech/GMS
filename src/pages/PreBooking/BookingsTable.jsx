import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import BookingRow from "./BookingRow.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";

export default function BookingsTable({
  bookings,
  loading,
  error,
  onUpdate,
  onCarIn,
  onCancelled,
  onEdit,
  currentUser,
  rowLoadingIds = new Set(), // NEW: row-level loading set
}) {
  const rows = useMemo(() => bookings || [], [bookings]);

  // Selection state
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Row refs for keyboard navigation
  const rowRefs = useRef([]);

  // Keep selection stable across data changes
  useEffect(() => {
    if (!rows.length) {
      setSelectedIndex(null);
      setSelectedId(null);
      return;
    }
    if (selectedId) {
      const idx = rows.findIndex((r) => (r.id || r._id) === selectedId);
      if (idx !== -1) {
        setSelectedIndex(idx);
      } else {
        setSelectedIndex(0);
        setSelectedId(rows[0].id || rows[0]._id);
      }
    } else {
      setSelectedIndex(0);
      setSelectedId(rows[0].id || rows[0]._id);
    }
  }, [rows.length, selectedId, rows]);

  // Scroll + focus when selection changes
  useEffect(() => {
    if (selectedIndex == null) return;
    const el = rowRefs.current[selectedIndex];
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [selectedIndex]);

  const selectRow = useCallback(
    (idx) => {
      if (idx < 0 || idx >= rows.length) return;
      setSelectedIndex(idx);
      setSelectedId(rows[idx].id || rows[idx]._id);
    },
    [rows]
  );

  const onKeyDown = (e) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectRow(selectedIndex == null ? 0 : Math.min(selectedIndex + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectRow(selectedIndex == null ? rows.length - 1 : Math.max(selectedIndex - 1, 0));
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Pre-Bookings</h2>

      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="outline-none overflow-auto max-w-full"
        aria-label="Pre-bookings table container"
      >
        <table className="w-full table-auto text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border text-[13px]">#</th>
              <th className="p-2 border text-[13px]">Booking Date</th>
              <th className="p-2 border text-[13px]">Landing Date</th>
              <th className="p-2 border text-[13px]">Reg No.</th>
              <th className="p-2 border text-[13px]">Make &amp; Model</th>
              <th className="p-2 border text-[13px]">Client</th>
              <th className="p-2 border text-[13px]">Phone</th>
              <th className="p-2 border text-[13px]">Post Code</th>
              <th className="p-2 border text-[13px]">Booking Price</th>
              <th className="p-2 border text-[13px]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-500 flex justify-center">
                  <InlineSpinner /> Loading pre-bookings...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={13} className="p-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-500">
                  No pre-bookings found
                </td>
              </tr>
            ) : (
              rows.map((booking, idx) => (
                <BookingRow
                  key={booking.id || booking._id}
                  ref={(el) => (rowRefs.current[idx] = el)}
                  booking={booking}
                  index={idx}
                  isSelected={idx === selectedIndex}
                  onSelect={() => selectRow(idx)}
                  onUpdate={onUpdate}
                  onCarIn={onCarIn}
                  onCancelled={onCancelled}
                  onEdit={onEdit}
                  currentUser={currentUser}
                  loading={rowLoadingIds.has(booking.id || booking._id)} // pass row loading
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
