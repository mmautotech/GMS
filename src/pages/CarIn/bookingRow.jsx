import React from "react";
import { FiFileText, FiArrowRightCircle, FiEye } from "react-icons/fi";

export default function BookingRow({ booking, onCarOut, onSelectBooking, openInvoiceModal, loadingCarOutId }) {
    return (
        <tr className="border-t">
            <td className="py-2 px-4">{booking.arrivedAt ? new Date(booking.arrivedAt).toLocaleString() : "-"}</td>
            <td className="py-2 px-4">{booking.vehicleRegNo || "-"}</td>
            <td className="py-2 px-4">{booking.makeModel || "-"}</td>
            <td className="py-2 px-4">{booking.ownerName || "-"}</td>
            <td className="py-2 px-4">{booking.ownerNumber || "-"}</td>
            <td className="py-2 px-4">{booking.createdBy?.username || "-"}</td>
            <td className="py-2 px-4 flex gap-3 items-center">
                <FiEye
                    className="text-blue-600 cursor-pointer hover:text-blue-800 text-xl"
                    title="View Booking"
                    onClick={() => onSelectBooking(booking)}
                />
                <FiFileText
                    className="text-purple-600 cursor-pointer hover:text-purple-800 text-xl"
                    title="Invoice"
                    onClick={() => openInvoiceModal(booking)}
                />
                {loadingCarOutId === booking._id ? (
                    <span className="text-blue-600 text-sm">Processing...</span>
                ) : (
                    <FiArrowRightCircle
                        className="text-blue-600 cursor-pointer hover:text-blue-800 text-xl"
                        title="Car Out"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCarOut(booking);
                        }}
                    />
                )}
            </td>
        </tr>
    );
}