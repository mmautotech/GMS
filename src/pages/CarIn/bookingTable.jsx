// src/pages/CarIn/bookingTable.jsx
import React, { useState } from "react";

export default function BookingTable({ bookings, onCarOut, onSelectBooking, loadingCarOutId }) {
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

    if (!bookings || bookings.length === 0) {
        return <p className="text-gray-500">No arrived cars yet.</p>;
    }

    return (
        <>
            <table className="min-w-full bg-white border rounded-lg">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border">Arrival Date</th>
                        <th className="py-2 px-4 border">Car Reg No</th>
                        <th className="py-2 px-4 border">Make & Model</th>
                        <th className="py-2 px-4 border">Client</th>
                        <th className="py-2 px-4 border">Phone</th>
                        <th className="py-2 px-4 border">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((b) => (
                        <tr key={b._id} className="border-t">
                            <td className="py-2 px-4">{b.arrivedAt}</td>

                            {/* Clickable Reg No */}
                            <td
                                className="py-2 px-4 text-blue-600 cursor-pointer underline"
                                onClick={() => onSelectBooking(b)}
                            >
                                {b.vehicleRegNo}
                            </td>

                            <td className="py-2 px-4">{b.makeModel}</td>
                            <td className="py-2 px-4">{b.ownerName}</td>
                            <td className="py-2 px-4">{b.ownerNumber}</td>

                            {/* Action Buttons */}
                            <td className="py-2 px-4 flex gap-2">
                                {/* Upsell button */}
                                <button
                                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                    onClick={() => onSelectBooking(b)}
                                >
                                    Upsell
                                </button>

                                {/* Car Out button */}
                                <button
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent row click
                                        onCarOut(b);
                                    }}
                                    disabled={loadingCarOutId === b._id}
                                >
                                    {loadingCarOutId === b._id ? "Processing..." : "Car Out"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Upsell Modal */}
            {isUpsellModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg w-96 max-w-full relative">
                        <h2 className="text-xl font-bold mb-4">Add Upsell</h2>
                        <p>Here you can add upsell items for this booking: {selectedBooking?.vehicleRegNo}</p>

                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold"
                            onClick={closeUpsellModal}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
