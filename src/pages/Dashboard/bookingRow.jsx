// src/pages/bookingRow.jsx
import React, { useMemo } from "react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function BookingRow({ booking }) {
    // Compute profit percentage
    const profitPct = useMemo(() => {
        const totalCost = (Number(booking.labourCost) || 0) + (Number(booking.partsCost) || 0);
        return booking.bookingPrice
            ? ((Number(booking.bookingPrice) - totalCost) / Number(booking.bookingPrice)) * 100
            : 0;
    }, [booking]);

    // Format services / remarks
    const servicesText = useMemo(() => {
        if (Array.isArray(booking.services) && booking.services.length > 0) {
            return booking.services
                .map((s) => (typeof s === "object" ? s.label || s.name : s))
                .join(", ");
        }
        return booking.remarks || "—";
    }, [booking]);

    // Format GBP values
    const fmtGBP = (val) => (val != null ? `£${Number(val).toLocaleString("en-GB")}` : "");

    return (
        <tr className="hover:bg-gray-50">
            <td className="p-2 border">{booking.rowNumber}</td> {/* ✅ Use backend rowNumber */}
            <td className="p-2 border">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ""}</td>
            <td className="p-2 border">{booking.vehicleRegNo}</td>
            <td className="p-2 border">{booking.makeModel}</td>
            <td className="p-2 border">{booking.ownerName}</td>
            <td className="p-2 border">{booking.ownerAddress}</td>
            <td className="p-2 border">{booking.ownerNumber}</td>
            <td className="p-2 border">{servicesText}</td>
            <td className="p-2 border">{fmtGBP(booking.bookingPrice)}</td>
            <td className="p-2 border">{fmtGBP(booking.labourCost)}</td>
            <td className="p-2 border">{fmtGBP(booking.partsCost)}</td>
            <td className="p-2 border">{profitPct ? `${profitPct.toFixed(2)}%` : "0%"}</td>
            <td className="p-2 border"><StatusBadge status={booking.status} /></td>
        </tr>
    );
}
