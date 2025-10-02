// BookingDetailsExpandedRow.jsx
import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function BookingDetailsExpandedRow({
    details,
    loading,
    error,
    bookingPhotoUrl,
    upsellPhotoUrls,
    handleBookingThumbnailClick,
    handleUpsellThumbnailClick,
}) {
    const fmtGBP = (val) =>
        val != null
            ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
            : "—";

    const safe = (s) => (s ? String(s) : "—");

    if (loading) {
        return (
            <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                    Loading details...
                </td>
            </tr>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={10} className="p-4 text-center text-red-500">
                    {error}
                </td>
            </tr>
        );
    }

    if (!details) return null;

    return (
        <tr className="bg-gray-50">
            <td colSpan={10} className="p-3">
                <div className="bg-white rounded-lg shadow p-5 space-y-6 text-sm">
                    {/* Prebooking info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="mt-3 text-gray-500 text-xs font-bold uppercase">
                                Complete Address
                            </p>
                            <p>{safe(details.ownerAddress)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Labour</p>
                            <p className="text-green-600">{fmtGBP(details.labourCost)}</p>
                            <p className="mt-2 text-gray-500 text-xs font-bold uppercase">Parts</p>
                            <p className="text-green-600">{fmtGBP(details.partsCost)}</p>
                            <p className="mt-2 text-gray-500 text-xs font-bold uppercase">Profit</p>
                            <p className="text-blue-600">
                                {fmtGBP(details.profit)} ({details.profitPercent}%)
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase">Services</p>
                            <p>{details.services?.map((s) => s.name || s.label || s).join(", ")}</p>
                            <p className="mt-3 text-gray-500 text-xs font-bold uppercase">Remarks</p>
                            <p>{safe(details.remarks)}</p>
                            <p className="mt-3 text-gray-500 text-xs font-bold uppercase">Source</p>
                            <p>{safe(details.source)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            {bookingPhotoUrl ? (
                                <>
                                    <p className="text-gray-500 text-xs font-bold uppercase mb-2">
                                        Confirmation Photo
                                    </p>
                                    <img
                                        src={bookingPhotoUrl}
                                        alt="Booking Preview"
                                        className="h-40 w-auto object-contain rounded border cursor-pointer hover:opacity-80"
                                        onClick={handleBookingThumbnailClick}
                                    />
                                </>
                            ) : (
                                <p className="text-gray-500 text-xs">No Photo</p>
                            )}
                        </div>
                    </div>

                    {/* Upsells */}
                    {details.upsells?.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h4 className="text-gray-700 font-bold text-sm uppercase border-b pb-1">
                                Upsells
                            </h4>
                            <div className="space-y-4">
                                {details.upsells.map((u) => (
                                    <div
                                        key={u._id}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3 bg-gray-100 rounded"
                                    >
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase">Services</p>
                                            <p>{u.services?.map((s) => s.name || s.label || s).join(", ")}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase">Labour</p>
                                            <p className="text-green-600">{fmtGBP(u.labourCost)}</p>
                                            <p className="mt-2 text-gray-500 text-xs font-bold uppercase">Parts</p>
                                            <p className="text-green-600">{fmtGBP(u.partsCost)}</p>
                                            <p className="mt-2 text-gray-500 text-xs font-bold uppercase">Upsell Price</p>
                                            <p className="text-blue-600">{fmtGBP(u.upsellPrice)}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            {upsellPhotoUrls[u._id] ? (
                                                <>
                                                    <p className="text-gray-500 text-xs font-bold uppercase mb-2">
                                                        Upsell Photo
                                                    </p>
                                                    <img
                                                        src={upsellPhotoUrls[u._id]}
                                                        alt="Upsell Preview"
                                                        className="h-40 w-auto object-contain rounded border cursor-pointer hover:opacity-80"
                                                        onClick={() => handleUpsellThumbnailClick(u._id)}
                                                    />
                                                </>
                                            ) : (
                                                <p className="text-gray-500 text-xs">No Photo</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}
