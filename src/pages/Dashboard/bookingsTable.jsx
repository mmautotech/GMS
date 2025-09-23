// src/pages/Dashboard/bookingsTable.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import BookingRow from "./bookingRow.jsx";

export default function BookingsTable({ bookings, loading, error }) {
    const rows = useMemo(() => bookings || [], [bookings]);

    // Selection state
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Row refs to focus/scroll selected row
    const rowRefs = useRef([]);

    // Keep selection stable across data changes (prefer same id; else first row)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.length]);

    // Focus + ensure visible when selection changes
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
            <h2 className="text-xl font-semibold mb-4">Bookings</h2>

            {/* The scroll happens INSIDE this wrapper, not the whole page */}
            <div
                tabIndex={0}
                onKeyDown={onKeyDown}
                className="outline-none overflow-auto max-w-full"
                aria-label="Bookings table container"
            >
                {/* table-auto, compact font; keep cells on one line */}
                <table className="w-full table-auto text-xs whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-200 text-left">
                            <th className="p-2 border text-[13px]">#</th>
                            <th className="p-2 border text-[13px]">Booking Date</th>
                            <th className="p-2 border text-[13px]">Landing Date</th>
                            <th className="p-2 border text-[13px]">Reg No.</th>
                            <th className="p-2 border text-[13px]">Make &amp; Model</th>
                            <th className="p-2 border text-[13px] hidden sm:table-cell">Client Name</th>
                            <th className="p-2 border text-[13px] hidden lg:table-cell">Address</th>
                            <th className="p-2 border text-[13px] hidden md:table-cell">Phone</th>
                            <th className="p-2 border text-[13px] hidden md:table-cell">Services</th>
                            <th className="p-2 border text-[13px]">Booking Price</th>
                            <th className="p-2 border text-[13px] hidden sm:table-cell">Labour Price</th>
                            <th className="p-2 border text-[13px] hidden sm:table-cell">Parts Price</th>
                            <th className="p-2 border text-[13px] hidden md:table-cell">Profit %</th>
                            <th className="p-2 border text-[13px]">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={14} className="p-4 text-center text-gray-500">
                                    Loading bookings...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={14} className="p-4 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="p-4 text-center text-gray-500">
                                    No bookings found
                                </td>
                            </tr>
                        ) : (
                            rows.map((booking, idx) => (
                                <BookingRow
                                    key={booking.id || booking._id}
                                    ref={(el) => (rowRefs.current[idx] = el)}
                                    booking={booking}
                                    isSelected={idx === selectedIndex}
                                    onSelect={() => selectRow(idx)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
