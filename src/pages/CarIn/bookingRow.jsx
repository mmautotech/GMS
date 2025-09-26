// src/pages/CarIn/BookingRow.jsx
import React, { useState, useMemo, forwardRef, useEffect } from "react";
import { Trash2, Car, FileText, Eye, X } from "lucide-react";
import { createPortal } from "react-dom";
import useBookingDetails from "../../hooks/useBookingDetails.js";

const fmtDateTime = (d) =>
    d
        ? new Date(d).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

const fmtGBP = (val) =>
    val != null
        ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
        : "—";

const safe = (s) => (s ? String(s) : "—");

const BookingRow = forwardRef(function BookingRow(
    { booking: initialBooking, index, isSelected, onSelect, onCarOut, onCancelled, onSelectBooking, openInvoiceModal, loadingCarOutId },
    ref
) {
    const [expanded, setExpanded] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [fullPhotoUrl, setFullPhotoUrl] = useState(null);

    const booking = initialBooking;
    const bookingId = booking._id || booking.id;

    const {
        details,
        loading,
        error,
        fetchDetails,
        fetchPhoto,
        originalPhotoUrl,
    } = useBookingDetails();

    const servicesText = useMemo(() => {
        if (!booking.services) return "—";
        return booking.services
            .map((s) => (typeof s === "object" ? s.label || s.name : s))
            .join(", ");
    }, [booking.services]);


    // fetch details only when expanded
    useEffect(() => {
        if (expanded && !details && !loading) {
            fetchDetails(bookingId);
        }
    }, [expanded, bookingId, details, loading, fetchDetails]);

    useEffect(() => {
        return () => {
            if (fullPhotoUrl) URL.revokeObjectURL(fullPhotoUrl);
        };
    }, [fullPhotoUrl]);

    const handleThumbnailClick = async () => {
        if (originalPhotoUrl) {
            setFullPhotoUrl(originalPhotoUrl);
            setShowPhoto(true);
        } else {
            const res = await fetchPhoto(bookingId, "original");
            if (res.ok && res.url) {
                setFullPhotoUrl(res.url);
                setShowPhoto(true);
            }
        }
    };

    return (
        <>
            {/* Main Row */}
            <tr
                ref={ref}
                role="row"
                tabIndex={-1}
                aria-selected={!!isSelected}
                className={`cursor-pointer outline-none ${isSelected ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-gray-50"
                    }`}
                onClick={onSelect}
                onDoubleClick={() => setExpanded((p) => !p)}
            >
                <td className="p-2 border">{booking.rowNumber || index + 1}</td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{fmtDateTime(booking.bookingDate)}</div>
                        <div className="text-[11px] text-gray-600">by {safe(booking.bookedBy)}</div>
                    </div>
                </td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{fmtDateTime(booking.arrivalDate)}</div>
                        <div className="text-[11px] text-gray-600">by {safe(booking.arrivedBy)}</div>
                    </div>
                </td>
                <td className="p-2 border">{safe(booking.registration)}</td>
                <td className="p-2 border">{safe(booking.makeModel)}</td>
                <td className="p-2 border">
                    <div className="leading-tight">
                        <div>{safe(booking.ownerName)}</div>
                        <div className="text-[11px] text-gray-600">{safe(booking.email)}</div>
                    </div>
                </td>
                <td className="p-2 border hidden md:table-cell">{safe(booking.phoneNumber)}</td>
                <td className="p-2 border hidden lg:table-cell">{safe(booking.postCode)}</td>
                <td className="p-2 border">{fmtGBP(booking.bookingPrice)}</td>
                <td className="p-2 border">
                    <div className="flex gap-2">
                        {/* View Booking */}
                        <button
                            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectBooking(booking);
                            }}
                            title="View"
                        >
                            <Eye size={14} />
                        </button>

                        {/* Invoice */}
                        <button
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                openInvoiceModal(booking);
                            }}
                            title="Invoice"
                        >
                            <FileText size={14} />
                        </button>

                        {/* Car Out */}
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCarOut(booking);
                            }}
                            disabled={loadingCarOutId === booking._id}
                            title="Car Out"
                        >
                            {loadingCarOutId === booking._id ? "Processing..." : <><Car size={14} /></>}
                        </button>
                        {/* Cancel */}
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelled(booking._id);
                            }}
                            title="Cancel"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded Row */}
            {expanded && (
                <tr className="bg-gray-50">
                    <td colSpan={10} className="p-3">
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading details…</p>
                        ) : error ? (
                            <p className="text-sm text-red-500">{error}</p>
                        ) : details ? (
                            <div className="bg-white rounded-lg shadow p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                <div>
                                    <p className="mt-3 text-gray-500 text-xs font-bold uppercase">Complete Address</p>
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
                                    <p>{servicesText}</p>
                                    <p className="mt-3 text-gray-500 text-xs font-bold uppercase">Remarks</p>
                                    <p>{safe(details.remarks)}</p>
                                    <p className="mt-3 text-gray-500 text-xs font-bold uppercase">Source</p>
                                    <p>{safe(details.source)}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    {details.compressedPhoto ? (
                                        <>
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">
                                                Confirmation Photo
                                            </p>
                                            <img
                                                src={details.compressedPhoto}
                                                alt="Booking Compressed Preview"
                                                className="h-40 w-auto object-contain rounded border cursor-pointer hover:opacity-80"
                                                onClick={handleThumbnailClick}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-gray-500 text-xs">No Photo</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No details available.</p>
                        )}
                    </td>
                </tr>
            )}

            {/* Lightbox */}
            {showPhoto &&
                fullPhotoUrl &&
                createPortal(
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <button
                            className="absolute top-4 right-4 text-white"
                            onClick={() => setShowPhoto(false)}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={fullPhotoUrl}
                            alt="Full Booking Confirmation"
                            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
                        />
                    </div>,
                    document.body
                )}
        </>
    );
});

export default BookingRow;
