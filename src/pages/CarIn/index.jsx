import React, { useCallback, useState, useRef } from "react";
import { toast } from "react-toastify";

import useBookings from "../../hooks/useBokings.js";
import BookingTable from "./BookingTable.jsx";
import BookingsContent from "./BookingsContent.jsx";
import BookingDetailModal from "./BookingDetailModal.jsx";
import UpsellModal from "./UpsellModal.jsx";

export default function CarInPage() {
    const bookingDetailRef = useRef(null);

    const [loadingCarOutId, setLoadingCarOutId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // "booking" | "upsell" | null

    // --- Bookings hook: only "arrived" bookings ---
    const {
        list: bookings,
        setList: setBookings,
        loadingList,
        error,
        setError,
        refresh,
        page,
        setPage,
        totalPages,
        totalItems,
    } = useBookings({ mode: "arrived" });

    // --- Handle Car Out ---
    const handleCarOut = useCallback(
        async (booking) => {
            setLoadingCarOutId(booking._id);
            try {
                const res = await refresh.updateStatus(booking._id, "completed"); // Hook handles BookingApi
                if (res.ok) {
                    toast.success("Car checked out successfully!");
                    setBookings((prev) => prev.filter((b) => b._id !== booking._id));
                    await refresh();
                } else {
                    toast.error(res.error || "Failed to check out car");
                }
            } catch (err) {
                const backendMessage =
                    err?.response?.data?.message || err.message || "Failed to check out car";
                setError(backendMessage);
                toast.error(backendMessage);
            } finally {
                setLoadingCarOutId(null);
            }
        },
        [refresh, setBookings, setError]
    );

    // --- Open Booking Detail ---
    const handleSelectBooking = (booking) => {
        setSelectedBooking(booking);
        setActiveModal("booking");
    };

    // --- Open Upsell Modal ---
    const handleAddUpsell = () => {
        setActiveModal("upsell");
    };

    // --- After Upsell Saved ---
    const handleUpsellClose = async () => {
        setActiveModal("booking");
        if (bookingDetailRef.current?.refreshUpsells) {
            bookingDetailRef.current.refreshUpsells();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-900">Arrived Cars</h1>

            <BookingsContent
                loading={loadingList}
                error={error}
                items={bookings}
                TableComponent={BookingTable}
                tableProps={{
                    bookings,
                    onCarOut: handleCarOut,
                    onSelectBooking: handleSelectBooking,
                    loadingCarOutId,
                }}
                emptyMessage="No arrived bookings found."
            />

            {/* Booking Detail Modal */}
            {activeModal === "booking" && selectedBooking && (
                <BookingDetailModal
                    ref={bookingDetailRef}
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    onAddUpsell={handleAddUpsell}
                />
            )}

            {/* Upsell Modal */}
            {activeModal === "upsell" && selectedBooking && (
                <UpsellModal booking={selectedBooking} isOpen={true} onClose={handleUpsellClose} />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    <button
                        disabled={page <= 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 border rounded">
                        Page {page} of {totalPages} ({totalItems} bookings)
                    </span>
                    <button
                        disabled={page >= totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}