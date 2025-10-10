// src/pages/PreBooking/PreBookingPage.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";


import { usePreBookings } from "../../hooks/useBookingsList.js";
import useBookings from "../../hooks/useBookings.js";
import useServiceOptions from "../../hooks/useServiceOptions.js";
import useUsers from "../../hooks/useUsers.js";


import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import BookingsTable from "./BookingsTable.jsx";
import BookingForm from "./BookingForm.jsx";
import Modal from "../../components/Modal.jsx";


// dropdown configs
const SORT_OPTIONS = [
  { label: "Booking Date", value: "createdDate" },
  { label: "Landing Date", value: "scheduledDate" },
  { label: "Registration No", value: "vehicleRegNo" },
  { label: "Make & Model", value: "makeModel" },
  { label: "Phone Number", value: "ownerNumber" },
  { label: "Post Code", value: "ownerPostalCode" },
];
const LIMIT_OPTIONS = [5, 25, 50, 100];


export default function PreBookingPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);


  // key to force refresh
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);


  // filters
  const [draft, setDraft] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    services: "",
    user: "",
    sortBy: "createdDate",
    sortDir: "desc",
    limit: 25,
  });
  const [applied, setApplied] = useState(draft);


  // include page & refreshKey to trigger re-fetch
  const preBookingParams = useMemo(
    () => ({ ...applied, page, refreshKey }),
    [applied, page, refreshKey]
  );


  const { saving, create, update, setError, updateStatus } = useBookings();


  const {
    list: serviceOptions,
    loading: loadingServices,
    error: servicesError,
  } = useServiceOptions({ useSessionCache: true });


  const {
    list: userOptions,
    map: userMap,
    loading: loadingUsers,
    error: usersError,
  } = useUsers({ useSessionCache: true });


  // ------------------ Actions ------------------
  const handleCarIn = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to mark this car as ARRIVED?")) return;
      try {
        const res = await updateStatus(id, "arrived");
        if (res.ok) {
          toast.success(res.message || "Car marked as arrived!");
          setRefreshKey((k) => k + 1);
          navigate("/car-in");
        } else {
          toast.error(res.error || "Failed to mark as arrived");
        }
      } catch (err) {
        const backendMessage = err?.response?.data?.message || err.message || "Failed to mark as arrived";
        setError(backendMessage);
        toast.error(backendMessage);
      }
    },
    [updateStatus, navigate, setError]
  );


  const handleCancelled = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to CANCEL this booking?")) return;
      try {
        const res = await updateStatus(id, "cancelled");
        if (res.ok) {
          toast.success(res.message || "Booking cancelled successfully!");
          setRefreshKey((k) => k + 1);
        } else {
          toast.error(res.error || "Failed to cancel booking");
        }
      } catch (err) {
        const backendMessage = err?.response?.data?.message || err.message || "Failed to cancel booking";
        setError(backendMessage);
        toast.error(backendMessage);
      }
    },
    [updateStatus, setError]
  );


  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setShowModal(true);
  };


  const handleFormSubmit = async ({ payload, reset }) => {
    try {
      if (editingBooking) {
        const res = await update(editingBooking._id, payload);
        if (res.ok) {
          toast.success("Booking updated!");
          reset?.();
          setShowModal(false);
          setEditingBooking(null);
          setRefreshKey((k) => k + 1);
        } else {
          toast.error(res.error || "Failed to update booking");
        }
      } else {
        const res = await create(payload);
        if (res.ok) {
          toast.success("Booking created!");
          reset?.();
          setShowModal(false);
          setRefreshKey((k) => k + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          toast.error(res.error || "Failed to create booking");
        }
      }
    } catch (err) {
      toast.error("Unexpected error while saving booking");
      console.error(err);
    }
  };


  const handleAddBooking = () => {
    setEditingBooking(null);
    setShowModal(true);
  };


  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };


  const resetFilters = () => {
    const fresh = {
      search: "",
      fromDate: "",
      toDate: "",
      services: "",
      user: "",
      sortBy: "createdDate",
      sortDir: "desc",
      limit: 25,
    };
    setDraft(fresh);
    setApplied(fresh);
    setPage(1);
  };


  const params = useMemo(() => preBookingParams, [preBookingParams]);


  // ------------------ Refresh Logic on navigation/focus ------------------
  useEffect(() => {
    // refresh immediately on mount or when user navigates back to this page
    setPage(1); // reset to first page
    setRefreshKey((k) => k + 1);


    const handleFocus = () => setRefreshKey((k) => k + 1);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") setRefreshKey((k) => k + 1);
    };


    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);


    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [location.key]); // ✅ triggers on every navigation


  // ------------------ Bookings List ------------------
  const BookingsList = () => {
    const { items: bookings, loadingList, totalPages, totalItems, hasNextPage, hasPrevPage } = usePreBookings(preBookingParams);


    return (
      <>
        {loadingList ? (
          <InlineSpinner label="Loading bookings…" />
        ) : (
          <BookingsTable
            bookings={bookings}
            onCarIn={handleCarIn}
            onCancelled={handleCancelled}
            onEdit={handleEdit}
            currentUser={user}
          />
        )}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">Total Bookings: {totalItems}</p>
          <div className="flex items-center gap-4">
            <button
              disabled={!hasPrevPage}
              onClick={() => hasPrevPage && setPage((p) => p - 1)}
              className={`px-3 py-1 rounded ${hasPrevPage ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Prev
            </button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={!hasNextPage}
              onClick={() => hasNextPage && setPage((p) => p + 1)}
              className={`px-3 py-1 rounded ${hasNextPage ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  };


  // ------------------ Render ------------------
  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Pre-Booking</h1>


      {/* Filters */}
      <div className="mb-3 space-y-3 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" placeholder="Search..." value={draft.search} onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))} className="border rounded px-3 py-2 w-full" />
          <input type="date" value={draft.fromDate} onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))} className="border rounded px-3 py-2 w-full" />
          <input type="date" value={draft.toDate} onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))} className="border rounded px-3 py-2 w-full" />
          <select value={draft.services} onChange={(e) => setDraft((d) => ({ ...d, services: e.target.value }))} className="border rounded px-3 py-2 w-full" disabled={loadingServices}>
            <option value="">{loadingServices ? "Loading..." : "All Services"}</option>
            {servicesError ? (
              <option disabled value="">Failed to load services</option>
            ) : (
              serviceOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
            )}
          </select>
          <select value={draft.user} onChange={(e) => setDraft((d) => ({ ...d, user: e.target.value }))} className="border rounded px-3 py-2 w-full" disabled={loadingUsers}>
            <option value="">{loadingUsers ? "Loading..." : "All Users"}</option>
            {usersError ? (
              <option disabled value="">Failed to load users</option>
            ) : (
              userOptions.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)
            )}
          </select>
        </div>


        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            <select value={draft.sortBy} onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value }))} className="border rounded px-3 py-2 w-full">
              {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={draft.sortDir} onChange={(e) => setDraft((d) => ({ ...d, sortDir: e.target.value }))} className="border rounded px-3 py-2 w-full">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <select value={draft.limit} onChange={(e) => setDraft((d) => ({ ...d, limit: Number(e.target.value) }))} className="border rounded px-3 py-2 w-full">
              {LIMIT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt} / page</option>)}
            </select>
          </div>
          <div className="flex gap-2 md:ml-4">
            <button onClick={applyFilters} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Apply</button>
            <button onClick={resetFilters} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Reset</button>
          </div>
        </div>
      </div>


      {/* Params Summary */}
      <ParamsSummary
        params={params}
        serviceMap={serviceOptions.reduce((acc, s) => { acc[s.value] = s.label; return acc; }, {})}
        userMap={userMap}
      />


      {/* Bookings List */}
      <BookingsList />


      {/* Floating Add Button */}
      <button
        onClick={handleAddBooking}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white w-16 h-16 rounded-full text-4xl font-bold flex items-center justify-center shadow-xl transition-transform hover:scale-110"
        title="Add New Booking"
      >
        +
      </button>


      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <BookingForm
          loading={saving}
          initialData={editingBooking}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}





