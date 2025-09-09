import React, { useMemo, useState } from "react";

// Format numbers in GBP
const numberFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function BookingRow({ booking, index, onCarOut, onAddUpsell, isLoading }) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const profit = useMemo(() => {
        const price = Number(booking.bookingPrice) || 0;
        const labour = Number(booking.labourCost) || 0;
        const parts = Number(booking.partsCost) || 0;
        return price - labour - parts;
    }, [booking]);

    const profitPct = useMemo(() => {
        const price = Number(booking.bookingPrice) || 0;
        return price ? ((profit / price) * 100).toFixed(2) : "0.00";
    }, [booking, profit]);

    const servicesText = useMemo(() => {
        if (Array.isArray(booking.services) && booking.services.length > 0) {
            return booking.services.map(s => (typeof s === "object" ? s.name || s.label : s)).join(", ");
        }
        return booking.remarks || "—";
    }, [booking]);

    const handleCarOut = e => {
        e.stopPropagation();
        if (onCarOut) onCarOut(booking);
    };

    const handleUpsell = e => {
        e.stopPropagation();
        if (onAddUpsell) onAddUpsell(booking);
    };

    const formatDate = date => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    return (
        <>
            <tr className="hover:bg-blue-50 transition cursor-pointer" onClick={() => setIsDetailOpen(true)}>
                <td className="p-2 border">{index + 1}</td>
                <td className="p-2 border">{formatDate(booking.arrivedAt)}</td>
                <td className="p-2 border">{booking.vehicleRegNo}</td>
                <td className="p-2 border">{booking.makeModel}</td>
                <td className="p-2 border">{booking.ownerName}</td>
                <td className="p-2 border">{booking.ownerNumber}</td>
                <td className="p-2 border">{booking.ownerAddress}</td>
                <td className="p-2 border">{numberFmt.format(booking.bookingPrice || 0)}</td>
                <td className="p-2 border">{numberFmt.format(booking.labourCost || 0)}</td>
                <td className="p-2 border">{numberFmt.format(booking.partsCost || 0)}</td>
                <td className="p-2 border">{numberFmt.format(profit)} ({profitPct}%)</td>
                <td className="p-2 border">{servicesText}</td>
                <td className="p-2 border capitalize">{booking.status}</td>
                <td className="p-2 border flex justify-center gap-2">
                    <button
                        onClick={handleUpsell}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                    >
                        Upsell
                    </button>
                    <button
                        onClick={handleCarOut}
                        disabled={isLoading}
                        className={`bg-green-600 text-white px-3 py-1 rounded ${isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-500"}`}
                    >
                        {isLoading ? "Processing..." : "Checkout"}
                    </button>
                </td>
            </tr>

            {/* Modal */}
            {isDetailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Car Details</h2>

                        <p><strong>Vehicle:</strong> {booking.vehicleRegNo}</p>
                        <p><strong>Make & Model:</strong> {booking.makeModel}</p>
                        <p><strong>Owner:</strong> {booking.ownerName}</p>
                        <p><strong>Phone:</strong> {booking.ownerNumber}</p>
                        <p><strong>Address:</strong> {booking.ownerAddress}</p>
                        <p><strong>Booking Price:</strong> {numberFmt.format(booking.bookingPrice)}</p>
                        <p><strong>Labour:</strong> {numberFmt.format(booking.labourCost)}</p>
                        <p><strong>Parts:</strong> {numberFmt.format(booking.partsCost)}</p>
                        <p><strong>Profit:</strong> {numberFmt.format(profit)} ({profitPct}%)</p>
                        <p><strong>Services / Remarks:</strong> {servicesText}</p>
                        <p><strong>Status:</strong> {booking.status}</p>

                        <button
                            className="absolute top-2 right-2 text-gray-600 font-bold text-xl hover:text-gray-900"
                            onClick={() => setIsDetailOpen(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
