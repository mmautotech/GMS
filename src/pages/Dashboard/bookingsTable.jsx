// src/pages/bookingsTable.jsx
import React, { useMemo } from "react";
import BookingRow from "./bookingRow.jsx";

export default function BookingsTable({ bookings, loading, error }) {
    // Sort by createdAt descending (optional if backend already sorted)
    const sortedBookings = useMemo(() => {
        return [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [bookings]);

    return (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Bookings</h2>

            <table className="w-full border-collapse text-sm min-w-[1000px]">
                <thead>
                    <tr className="bg-gray-200 text-left">
                        <th className="p-2 border">#</th>
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Reg No.</th>
                        <th className="p-2 border">Make & Model</th>
                        <th className="p-2 border">Client Name</th>
                        <th className="p-2 border">Address</th>
                        <th className="p-2 border">Phone</th>
                        <th className="p-2 border">Remarks / Services</th>
                        <th className="p-2 border">Booking Price</th>
                        <th className="p-2 border">Labour Price</th>
                        <th className="p-2 border">Parts Price</th>
                        <th className="p-2 border">Profit %</th>
                        <th className="p-2 border">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={13} className="p-4 text-center text-gray-500">
                                Loading bookings...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={13} className="p-4 text-center text-red-500">
                                {error}
                            </td>
                        </tr>
                    ) : sortedBookings.length === 0 ? (
                        <tr>
                            <td colSpan={13} className="p-4 text-center text-gray-500">
                                No bookings found
                            </td>
                        </tr>
                    ) : (
                        sortedBookings.map((booking) => (
                            <BookingRow
                                key={booking._id}
                                booking={booking}
                                rowNumber={booking.rowNumber} // ✅ use backend rowNumber
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
