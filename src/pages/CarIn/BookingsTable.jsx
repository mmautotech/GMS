// src/pages/CarIn/BookingsTable.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import InvoiceModal from "./InvoiceModal.jsx";
import BookingRow from "./bookingRow.jsx";

export default function BookingsTable({
    bookings,
    loading,
    error,
    onCancelled,
    onCarOut,
    onSelectBooking,
    loadingCarOutId,
}) {
    const rows = useMemo(() => bookings || [], [bookings]);

    // Selection state
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Row refs
    const rowRefs = useRef([]);

    // Invoice modal state
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const openInvoiceModal = (booking) => {
        setSelectedBooking(booking);
        setIsInvoiceModalOpen(true);
    };
    const closeInvoiceModal = () => {
        setSelectedBooking(null);
        setIsInvoiceModalOpen(false);
    };

    // Refresh a specific BookingRow
    const refreshBookingRow = (bookingId) => {
        const idx = rows.findIndex((r) => (r.id || r._id) === bookingId);
        if (idx !== -1 && rowRefs.current[idx]?.refresh) {
            rowRefs.current[idx].refresh();
        }
    };

    // Keep selection stable across data changes
    useEffect(() => {
        if (!rows.length) {
            setSelectedIndex(null);
            setSelectedId(null);
            return;
        }
        if (selectedId) {
            const idx = rows.findIndex((r) => (r.id || r._id) === selectedId);
            if (idx !== -1) setSelectedIndex(idx);
            else {
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
        if (el && typeof el.focus === "function") {
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
            <h2 className="text-xl font-semibold mb-4">Arrived Bookings</h2>

            <div
                tabIndex={0}
                onKeyDown={onKeyDown}
                className="outline-none overflow-auto max-w-full"
                aria-label="Arrived bookings table container"
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
                                <td colSpan={11} className="p-4 text-center text-gray-500">
                                    Loading arrived bookings...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={11} className="p-4 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="p-4 text-center text-gray-500">
                                    No arrived bookings found
                                </td>
                            </tr>
                        ) : (
                            rows.map((booking, idx) => (
                                <BookingRow
                                    key={booking.id || booking._id}
                                    ref={(el) => {
                                        rowRefs.current[idx] = el;
                                    }}
                                    booking={booking}
                                    index={idx}
                                    isSelected={idx === selectedIndex}
                                    onSelect={() => selectRow(idx)}
                                    onCancelled={onCancelled}
                                    onCarOut={onCarOut}
                                    onSelectBooking={onSelectBooking}
                                    openInvoiceModal={openInvoiceModal}
                                    loadingCarOutId={loadingCarOutId}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invoice Modal */}
            {selectedBooking && (
                <InvoiceModal
                    bookingId={selectedBooking._id}
                    isOpen={isInvoiceModalOpen}
                    onClose={closeInvoiceModal}
                    onRefreshRow={refreshBookingRow} // optional: pass refresh callback
                />
            )}
        </div>
    );
}
