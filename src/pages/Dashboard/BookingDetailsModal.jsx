// BookingDetailsModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import PurchaseInvoiceApi from "../../lib/api/purchaseInvoiceApi.js";
import useBookingDetails from "../../hooks/useBookingDetails.js";

export default function BookingDetailsModal({ bookingId, onClose }) {
    const {
        details,
        loading,
        error,
        fetchDetails,
        bookingPhotoUrl,
        upsellPhotoUrls,
        fetchOriginalBookingPhoto,
        fetchUpsellPhoto,
    } = useBookingDetails();

    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [fullPhotoUrl, setFullPhotoUrl] = useState(null);
    const [showUpsellPhoto, setShowUpsellPhoto] = useState(null);

    const fmtGBP = (val) =>
        val != null
            ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
            : "—";

    const safe = (s) => (s ? String(s) : "—");

    useEffect(() => {
        if (!bookingId) return;

        fetchDetails(bookingId);

        setInvoicesLoading(true);
        PurchaseInvoiceApi.getInvoicesByBookingId(bookingId)
            .then((res) => {
                if (res.success === false) setInvoices([]);
                else {
                    const normalized = res.map((inv) => ({
                        ...inv,
                        items: inv.items.map((item) => ({
                            ...item,
                            partName: item.part?.partName || "Unknown Part",
                            partNumber: item.part?.partNumber || "",
                            supplier: inv.supplier || null,
                        })),
                    }));
                    setInvoices(normalized);
                }
            })
            .finally(() => setInvoicesLoading(false));
    }, [bookingId, fetchDetails]);

    // ---------- Lightbox Handlers ----------
    const handleBookingThumbnailClick = async () => {
        const originalUrl = await fetchOriginalBookingPhoto();
        if (originalUrl) {
            setFullPhotoUrl(originalUrl);
            setShowPhoto(true);
        } else if (bookingPhotoUrl) {
            setFullPhotoUrl(bookingPhotoUrl);
            setShowPhoto(true);
        }
    };

    const handleUpsellThumbnailClick = async (upsellId) => {
        let url = upsellPhotoUrls[upsellId];
        if (!url) url = await fetchUpsellPhoto(bookingId, upsellId);
        if (url) setShowUpsellPhoto({ url, id: upsellId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90%] overflow-y-auto p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-black"
                >
                    <X size={20} />
                </button>

                {/* Loading & Error */}
                {loading && <p className="text-gray-500">Loading booking details...</p>}
                {error && !loading && <p className="text-red-500">{error}</p>}

                {!loading && !error && details && (
                    <div className="space-y-6 text-sm">
                        {/* Booking Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">
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
                                                    <img
                                                        src={upsellPhotoUrls[u._id]}
                                                        alt="Upsell Preview"
                                                        className="h-40 w-auto object-contain rounded border cursor-pointer hover:opacity-80"
                                                        onClick={() => handleUpsellThumbnailClick(u._id)}
                                                    />
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
                )}
            </div>

            {/* Lightbox for Booking / Upsell Photo */}
            {(showPhoto || showUpsellPhoto?.url) &&
                createPortal(
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <button
                            className="absolute top-4 right-4 text-white"
                            onClick={() => {
                                setShowPhoto(false);
                                setShowUpsellPhoto(null);
                            }}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={showPhoto ? fullPhotoUrl : showUpsellPhoto?.url}
                            alt="Full Preview"
                            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
                        />
                    </div>,
                    document.body
                )}
        </div>
    );
}
