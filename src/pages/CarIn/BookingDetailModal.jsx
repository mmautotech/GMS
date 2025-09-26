// src/pages/CarIn/BookingDetailModal.jsx
import React, {
    useEffect,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from "react";
import { UpsellApi } from "../../lib/api";

const numberFmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
});
const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-GB") : "-";

const BookingDetailModal = forwardRef(
    ({ isOpen, onClose, booking, onAddUpsell }, ref) => {
        const [upsells, setUpsells] = useState([]);
        const [prebookingData, setPrebookingData] = useState({});

        // Fetch upsells & prebooking info
        const fetchUpsells = useCallback(async () => {
            if (!booking?._id) return;
            try {
                const response = await UpsellApi.getUpsellsByBooking(booking._id);

                setUpsells(response.upsells || []);
                setPrebookingData({
                    services: response.prebookingServices || [],
                    labourCost: Number(response.prebookingLabourCost) || 0,
                    parts: response.prebookingParts || [], // added parts support
                    partsCost: Number(response.prebookingPartsCost) || 0,
                    bookingPrice: Number(response.prebookingBookingPrice) || 0,
                });
            } catch (err) {
                console.error("Failed to load upsells", err);
                setUpsells([]);
                setPrebookingData({});
            }
        }, [booking]);

        useImperativeHandle(ref, () => ({
            refreshUpsells: fetchUpsells,
        }));

        useEffect(() => {
            if (isOpen && booking?._id) {
                fetchUpsells();
            }
        }, [isOpen, booking, fetchUpsells]);

        if (!isOpen || !booking) return null;

        // Build rows: Prebooking + Upsells
        const rows = [
            {
                type: "Prebooking",
                service:
                    prebookingData.services?.map((s) => s.name || s.label).join(", ") ||
                    "-",
                part:
                    prebookingData.parts?.map((p) => p.partName).join(", ") || "-",
                partPrice: prebookingData.partsCost || 0,
                labourPrice: prebookingData.labourCost || 0,
                quotedPrice: prebookingData.bookingPrice || 0,
            },
            ...upsells.map((u) => ({
                type: "Upsell",
                service: u.services?.map((s) => s.name).join(", ") || "-",
                part: u.parts?.map((p) => p.partName).join(", ") || "-",
                partPrice: Number(u.partsCost) || 0,
                labourPrice: Number(u.labourCost) || 0,
                quotedPrice: Number(u.upsellPrice) || 0,
            })),
        ];

        // Totals
        const totals = rows.reduce(
            (acc, r) => {
                acc.partPrice += r.partPrice;
                acc.labourPrice += r.labourPrice;
                acc.quotedPrice += r.quotedPrice;
                return acc;
            },
            {
                type: "Total",
                service: "-",
                part: "-",
                partPrice: 0,
                labourPrice: 0,
                quotedPrice: 0,
            }
        );
        totals.profit =
            totals.quotedPrice - (totals.partPrice + totals.labourPrice);

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                <strong>Booking Date:</strong>{" "}
                                {formatDate(booking.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Arrival Date:</strong>{" "}
                                {formatDate(booking.arrivedAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">
                                {booking.makeModel || "-"}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Reg:</strong> {booking.vehicleRegNo || "-"}
                            </p>
                        </div>
                    </div>

                    {/* Owner Details */}
                    <div className="mb-4 text-sm text-gray-700 grid grid-cols-2 gap-2">
                        <div>
                            <strong>Owner:</strong> {booking.ownerName || "-"}
                        </div>
                        <div>
                            <strong>Contact:</strong> {booking.ownerNumber || "-"}
                        </div>
                        <div>
                            <strong>Address:</strong> {booking.ownerAddress || "-"}
                        </div>
                        <div>
                            <strong>Email:</strong> {booking.ownerEmail || "-"}
                        </div>
                        <div>
                            <strong>Status:</strong> {booking.status || "-"}
                        </div>
                        <div>
                            <strong>Source:</strong> {booking.source || "-"}
                        </div>
                        <div>
                            <strong>Remarks:</strong> {booking.remarks || "-"}
                        </div>
                    </div>

                    {/* Services + Upsells Table */}
                    <table className="min-w-full border rounded-lg mb-4">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-3 border">Type</th>
                                <th className="py-2 px-3 border">Service</th>
                                <th className="py-2 px-3 border">Part</th>
                                <th className="py-2 px-3 border text-right">Part Price</th>
                                <th className="py-2 px-3 border text-right">
                                    Labour Price
                                </th>
                                <th className="py-2 px-3 border text-right">
                                    Booking Price
                                </th>
                                <th className="py-2 px-3 border text-right">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} className="border-t">
                                    <td className="py-2 px-3 border">{r.type}</td>
                                    <td className="py-2 px-3 border">{r.service}</td>
                                    <td className="py-2 px-3 border">{r.part}</td>
                                    <td className="py-2 px-3 border text-right">
                                        {numberFmt.format(r.partPrice)}
                                    </td>
                                    <td className="py-2 px-3 border text-right">
                                        {numberFmt.format(r.labourPrice)}
                                    </td>
                                    <td className="py-2 px-3 border text-right">
                                        {numberFmt.format(r.quotedPrice)}
                                    </td>
                                    <td className="py-2 px-3 border text-right">
                                        {numberFmt.format(
                                            r.quotedPrice - (r.partPrice + r.labourPrice)
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {/* Totals */}
                            <tr className="bg-gray-100 font-semibold border-t-2">
                                <td className="py-2 px-3 border">{totals.type}</td>
                                <td className="py-2 px-3 border">{totals.service}</td>
                                <td className="py-2 px-3 border">{totals.part}</td>
                                <td className="py-2 px-3 border text-right">
                                    {numberFmt.format(totals.partPrice)}
                                </td>
                                <td className="py-2 px-3 border text-right">
                                    {numberFmt.format(totals.labourPrice)}
                                </td>
                                <td className="py-2 px-3 border text-right">
                                    {numberFmt.format(totals.quotedPrice)}
                                </td>
                                <td className="py-2 px-3 border text-right">
                                    {numberFmt.format(totals.profit)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Actions */}
                    <div className="flex justify-between">
                        <button
                            className="px-4 py-2 border rounded"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                                onClick={() => onAddUpsell?.(booking)}
                            >
                                + Add Upsell
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

export default BookingDetailModal;