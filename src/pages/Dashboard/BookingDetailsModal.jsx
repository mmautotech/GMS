// BookingDetailsModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import PurchaseInvoiceApi from "../../lib/api/purchaseInvoiceApi.js";

export default function BookingDetailsModal({
    details,
    loading,
    error,
    bookingPhotoUrl,
    upsellPhotoUrls,
    handleBookingThumbnailClick,
    handleUpsellThumbnailClick,
    onClose,
}) {
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    const fmtGBP = (val) =>
        val != null
            ? val.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
            : "—";

    const safe = (s) => (s ? String(s) : "—");

    useEffect(() => {
        if (!details?._id) return;

        setInvoicesLoading(true);
        PurchaseInvoiceApi.getInvoicesByBookingId(details._id)
            .then((res) => {
                if (res.success === false) {
                    setInvoices([]);
                } else {
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
    }, [details]);

    if (!details) return null;

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

                {loading && <p className="text-center text-gray-500">Loading details...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {/* Info */}
                {!loading && !error && (
                    <div className="space-y-6 text-sm">
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
                                <p>
                                    {details.services?.map((s) => s.name || s.label || s).join(", ")}
                                </p>

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

                        {/* Parts Section */}
                        {/* Parts Section */}
                        {(details.parts?.length > 0 || invoices.some((inv) => inv.items?.length > 0)) && (
                            <div className="mt-6">
                                <h4 className="text-gray-700 font-bold text-sm uppercase border-b pb-2 mb-3">
                                    Parts & Purchases
                                </h4>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border rounded-lg">
                                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Part Name</th>
                                                <th className="px-3 py-2 text-left">Part Number</th>
                                                <th className="px-3 py-2 text-right">Rate</th>
                                                <th className="px-3 py-2 text-center">Qty</th>
                                                <th className="px-3 py-2 text-left">Supplier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {/* Parts directly from booking (if any) */}
                                            {details.parts?.map((p, idx) => (
                                                <tr key={`booking-part-${idx}`} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">{p.part?.name || "Unknown Part"}</td>
                                                    <td className="px-3 py-2">{p.part?.partNumber || "—"}</td>
                                                    <td className="px-3 py-2 text-right text-green-600">
                                                        {fmtGBP(p.rate)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">{p.quantity}</td>
                                                    <td className="px-3 py-2 text-gray-500">Booking</td>
                                                </tr>
                                            ))}

                                            {/* Parts from invoices */}
                                            {invoices.map((inv) =>
                                                inv.items?.map((item, idx) => (
                                                    <tr key={`inv-${inv._id}-${idx}`} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2">{item.partName}</td>
                                                        <td className="px-3 py-2">{item.partNumber || "—"}</td>
                                                        <td className="px-3 py-2 text-right text-green-600">
                                                            {fmtGBP(item.rate)}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                                                        <td className="px-3 py-2 text-gray-600">
                                                            {item.supplier?.name || "Unknown"}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}


                        {/* Upsells */}
                        {details.upsells?.length > 0 && (
                            <div>
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
                                                <p>
                                                    {u.services?.map((s) => s.name || s.label || s).join(", ")}
                                                </p>
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
                )}
            </div>
        </div>
    );
}
