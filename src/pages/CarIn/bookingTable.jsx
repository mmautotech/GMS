import React, { useState } from "react";
import InvoiceModal from "./InvoiceModal.jsx"; // Make sure the file name matches exactly
import BookingRow from "./bookingRow.jsx";

export default function BookingTable({ bookings, onCarOut, onSelectBooking, loadingCarOutId }) {
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    if (!bookings || bookings.length === 0) {
        return <p className="text-gray-500">No arrived cars yet.</p>;
    }

    const openInvoiceModal = (booking) => {
        setSelectedBooking(booking);
        setIsInvoiceModalOpen(true);
    };

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
                        <th className="py-2 px-4 border">Created By</th>
                        <th className="py-2 px-4 border">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((b) => (
                        <BookingRow
                            key={b._id}
                            booking={b}
                            onCarOut={onCarOut}
                            onSelectBooking={onSelectBooking}
                            openInvoiceModal={openInvoiceModal}
                            loadingCarOutId={loadingCarOutId}
                        />
                    ))}
                </tbody>
            </table>

            {selectedBooking && (
                <InvoiceModal
                    bookingId={selectedBooking._id}
                    isOpen={isInvoiceModalOpen}
                    onClose={closeInvoiceModal}
                />
            )}
        </>
    );
}