// BookingRow.jsx
import React, { useMemo, forwardRef, useState } from "react";
import StatusBadge from "./StatusBadge.jsx";
import ServicesCell from "./ServicesCell.jsx";
import BookingDetailsModal from "./BookingDetailsModal.jsx";

// Format date consistently
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "—";

// Format GBP currency
const fmtGBP = (val) =>
    val != null
        ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
        : "—";

const safe = (s) => (s ? String(s) : "—");

const BookingRow = forwardRef(function BookingRow({ booking }, ref) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPhotoUrl, setModalPhotoUrl] = useState(null);

    // Profit % for main booking
    const profitPct = useMemo(() => {
        const totalCost = (Number(booking.labourCost) || 0) + (Number(booking.partsCost) || 0);
        return booking.bookingPrice
            ? ((Number(booking.bookingPrice) - totalCost) / Number(booking.bookingPrice)) * 100
            : 0;
    }, [booking]);

    const status = String(booking.status || "").toUpperCase();
    const hoverText = (() => {
        switch (status) {
            case "PENDING":
                return `Scheduled on ${fmtDate(booking.scheduledDate)} by ${safe(booking.createdBy)}`;
            case "ARRIVED":
                return `Arrived on ${fmtDate(booking.arrivedDate)} (Scheduled: ${fmtDate(
                    booking.scheduledDate
                )}) by ${safe(booking.arrivedBy)}`;
            case "COMPLETED":
                return `Completed on ${fmtDate(booking.completedDate)} by ${safe(booking.completedBy)}`;
            case "CANCELLED":
                return `Cancelled on ${fmtDate(booking.cancelledDate)} by ${safe(booking.cancelledBy)}`;
            default:
                return "";
        }
    })();

    const handleDoubleClick = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const openPhotoModal = (url) => setModalPhotoUrl(url);
    const closePhotoModal = () => setModalPhotoUrl(null);

    return (
        <>
            {/* Main booking row */}
            <tr
                ref={ref}
                className="cursor-pointer hover:bg-gray-50"
                role="row"
                tabIndex={-1}
                onDoubleClick={handleDoubleClick}
            >
                <td className="p-2 border">{booking.rowNumber}</td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{fmtDate(booking.bookingDate)}</div>
                        <div className="text-[11px] text-gray-500">by {safe(booking.bookedBy)}</div>
                    </div>
                </td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{fmtDate(booking.scheduledDate)}</div>
                        {booking.arrivedBy && (
                            <div className="text-[11px] text-gray-500">by {booking.arrivedBy}</div>
                        )}
                    </div>
                </td>
                <td className="p-2 border">{booking.registration}</td>
                <td className="p-2 border max-w-[160px] truncate" title={booking.makeModel}>
                    {booking.makeModel}
                </td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{safe(booking.ownerName)}</div>
                        <div className="text-[11px] text-gray-600">{safe(booking.email)}</div>
                    </div>
                </td>
                <td
                    className="p-2 border hidden lg:table-cell max-w-[240px] truncate"
                    title={booking.ownerAddress}
                >
                    {booking.ownerAddress} {booking.postCode}
                </td>
                <td className="p-2 border hidden md:table-cell">{safe(booking.phoneNumber)}</td>
                <td className="p-2 border hidden md:table-cell">
                    <ServicesCell services={booking.services} remarks={booking.remarks} />
                </td>
                <td className="p-2 border">{fmtGBP(booking.bookingPrice)}</td>
                <td className="p-2 border hidden sm:table-cell">{fmtGBP(booking.labourCost)}</td>
                <td className="p-2 border hidden sm:table-cell">{fmtGBP(booking.partsCost)}</td>
                <td className="p-2 border hidden md:table-cell">
                    {Number.isFinite(profitPct) ? `${profitPct.toFixed(2)}%` : "—"}
                </td>
                <td className="p-2 border">
                    <StatusBadge status={booking.status} title={hoverText} />
                </td>
            </tr>

            {/* Modal with booking details */}
            {isModalOpen && (
                <BookingDetailsModal
                    bookingId={booking._id} // Pass booking ID; modal fetches everything
                    onClose={closeModal}
                />
            )}

            {/* Photo preview modal */}
            {modalPhotoUrl && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                    onClick={closePhotoModal}
                >
                    <img
                        src={modalPhotoUrl}
                        alt="Preview"
                        className="max-h-[90%] max-w-[90%] object-contain rounded shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-5 right-5 text-white text-2xl font-bold"
                        onClick={closePhotoModal}
                    >
                        &times;
                    </button>
                </div>
            )}
        </>
    );
});

export default BookingRow;
