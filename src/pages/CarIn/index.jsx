// src/pages/CarIn/CarInPage.jsx
import React, { useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useBookings from "../../hooks/useBookings.js";
import BookingTable from "./bookingTable.jsx";
import BookingsContent from "./BookingsContent.jsx";
import BookingDetailModal from "./BookingDetailModal.jsx";
import UpsellModal from "./UpsellModal.jsx";

export default function CarInPage() {
    const navigate = useNavigate();
    const bookingDetailRef = useRef(null);

    const [loadingCarOutId, setLoadingCarOutId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // "booking" | "upsell" | null

    // --- Bookings hook ---
    const {
        list: bookings,
        setList: setBookings,
        loadingList,
        error,
        setError,
        updateStatus,
        refresh,
        page,
        setPage,
        totalPages,
        totalItems,
    } = useBookings({ status: "arrived" });

    // --- Handle Car Out ---
    const handleCarOut = useCallback(
        async (booking) => {
            setLoadingCarOutId(booking._id);
            try {
                const res = await updateStatus(booking._id, "completed");
                if (res.ok) {
                    toast.success("Car checked out successfully!");
                    setBookings((prev) => prev.filter((b) => b._id !== booking._id));
                    await refresh();
                } else {
                    toast.error(res.error || "Failed to check out car");
                }
            } catch (err) {
                const backendMessage = err.message || "Failed to check out car";
                setError(backendMessage);
                toast.error(backendMessage);
            } finally {
                setLoadingCarOutId(null);
            }
        },
        [updateStatus, refresh, setBookings, setError]
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
        // Reopen BookingDetailModal and refresh upsells
        setActiveModal("booking");
        if (bookingDetailRef.current?.refreshUpsells) {
            bookingDetailRef.current.refreshUpsells();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-900">Arrived Cars</h1>

            {/* Bookings Table */}
            <BookingsContent
                loading={loadingList}
                error={error}
                items={bookings}
                TableComponent={BookingTable}
                tableProps={{
                    bookings,
                    onCarOut: handleCarOut,
                    onSelectBooking: handleSelectBooking,
                    onAddUpsell: handleAddUpsell,
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
                <UpsellModal
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={handleUpsellClose}
                />
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
