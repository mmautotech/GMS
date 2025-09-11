import React, { useState } from "react";
import InvoiceModal from "../Invoice/InvoiceModel.jsx";

export default function BookingTable({ bookings, onCarOut, onSelectBooking, loadingCarOutId }) {
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    if (!bookings || bookings.length === 0) {
        return <p className="text-gray-500">No arrived cars yet.</p>;
    }

    // ✅ Open modal with booking
    const openInvoiceModal = (booking) => {
        setSelectedBooking(booking);
        setIsInvoiceModalOpen(true);
    };

    // ✅ Close modal
    const closeInvoiceModal = () => {
        setSelectedBooking(null);
        setIsInvoiceModalOpen(false);
    };

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
                            <td className="py-2 px-4">
                                {new Date(b.arrivedAt).toLocaleString()}
                            </td>
                            <td
                                className="py-2 px-4 text-blue-600 cursor-pointer underline"
                                onClick={() => onSelectBooking(b)}
                            >
                                {b.vehicleRegNo}
                            </td>
                            <td className="py-2 px-4">{b.makeModel}</td>
                            <td className="py-2 px-4">{b.ownerName}</td>
                            <td className="py-2 px-4">{b.ownerNumber}</td>
                            <td className="py-2 px-4 flex gap-2">
                                <button
                                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                    onClick={() => openInvoiceModal(b)}
                                >
                                    Invoice
                                </button>
                                <button
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
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

            {/* ✅ Invoice Modal (API handled inside InvoiceModal) */}
            <InvoiceModal
                bookingId={selectedBooking?._id}
                isOpen={isInvoiceModalOpen}
                onClose={closeInvoiceModal}
            />

        </>
    );
}
