import React, { useMemo, forwardRef } from "react";
import StatusBadge from "./StatusBadge.jsx";
import ServicesCell from "./ServicesCell.jsx";

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

const BookingRow = forwardRef(function BookingRow({ booking, isSelected, onSelect }, ref) {
    // Profit % calculation
    const profitPct = useMemo(() => {
        const totalCost = (Number(booking.labourCost) || 0) + (Number(booking.partsCost) || 0);
        return booking.bookingPrice
            ? ((Number(booking.bookingPrice) - totalCost) / Number(booking.bookingPrice)) * 100
            : 0;
    }, [booking]);

    // Status tooltip text
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

    return (
        <tr
            ref={ref}
            className={`cursor-pointer outline-none ${isSelected ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-gray-50"
                }`}
            role="row"
            aria-selected={!!isSelected}
            tabIndex={-1}
            onClick={onSelect}
        >
            <td className="p-2 border">{booking.rowNumber}</td>

            {/* Booking Date (createdDate) + createdBy */}
            <td className="p-2 border">
                <div className="leading-tight">
                    <div>{fmtDate(booking.createdDate)}</div>
                    <div className="text-[11px] text-gray-500">by {safe(booking.createdBy)}</div>
                </div>
            </td>

            {/* Landing Date (scheduledDate) + arrivedBy if present */}
            <td className="p-2 border">
                <div className="leading-tight">
                    <div>{fmtDate(booking.scheduledDate)}</div>
                    {booking.arrivedBy && (
                        <div className="text-[11px] text-gray-500">by {booking.arrivedBy}</div>
                    )}
                </div>
            </td>

            <td className="p-2 border">{booking.vehicleRegNo}</td>

            {/* Truncate Make & Model on narrow screens */}
            <td
                className="p-2 border max-w-[160px] truncate"
                title={booking.makeModel}
            >
                {booking.makeModel}
            </td>

            <td className="p-2 border hidden sm:table-cell">{booking.ownerName}</td>

            <td
                className="p-2 border hidden lg:table-cell max-w-[240px] truncate"
                title={booking.ownerAddress}
            >
                {booking.ownerAddress} {booking.ownerPostalCode}
            </td>

            <td className="p-2 border hidden md:table-cell">{booking.ownerNumber}</td>

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
    );
});

export default BookingRow;
