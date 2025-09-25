import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import usePreBookings from "../../hooks/usePreBookings.js";
import useBookings from "../../hooks/useBookings.js";
import useServices from "../../hooks/useServices.js";
import useUsers from "../../hooks/useUsers.js";

import ParamsSummary from "../../components/ParamsSummary.jsx";
import InlineSpinner from "../../components/InlineSpinner.jsx";
import BookingForm from "./bookingForm.jsx";
import BookingsTable from "./bookingsTable.jsx";
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

export default function PreBookingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // local filter draft (UI state only)
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

  // applied filters (used for API calls)
  const [applied, setApplied] = useState(draft);

  // fetch services (for dropdown)
  const {
    list: serviceOptions,
    map: serviceMap,
    loading: loadingServices,
    error: servicesError,
  } = useServices({ enabled: true, useSessionCache: true });

  const {
    list: userOptions,
    map: userMap,
    loading: loadingUsers,
    error: usersError,
  } = useUsers({ useSessionCache: true });

  // ✅ Memoize params to avoid re-fetch loops
  const preBookingParams = useMemo(() => applied, [applied]);

  // fetch pre-bookings
  const {
    items: bookings,
    loadingList,
    page,
    setPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    refresh,
    params: backendParams,
  } = usePreBookings(preBookingParams);

  // booking mutations
  const { saving, create, update, updateStatus } = useBookings();

  // ---------- FILTER ACTIONS ----------
  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };

  const resetFilters = () => {
    const reset = {
      search: "",
      fromDate: "",
      toDate: "",
      services: "",
      user: "",
      sortBy: "createdDate",
      sortDir: "desc",
      limit: 25,
    };
    setDraft(reset);
    setApplied(reset);
    setPage(1);
  };

  // ---------- BOOKING ACTIONS ----------
  const handleUpdate = useCallback(
    async (id, payload) => {
      const res = await update(id, payload);
      if (!res.ok) {
        toast.error(res.error || "Failed to update booking");
        return res;
      }
      toast.success("Booking updated!");
      refresh();
      return res;
    },
    [update, refresh]
  );

  const handleCarIn = useCallback(
    async (bookingId) => { // ✅ now gets only ID
      const res = await updateStatus(bookingId, "arrived");
      if (res.ok) {
        toast.success("Car marked as arrived!");
        refresh();
        navigate("/car-in");
      } else {
        toast.error(res.error || "Failed to mark car as arrived");
      }
    },
    [updateStatus, navigate, refresh]
  );

  const handleCancelled = useCallback(
    async (bookingId) => { // ✅ now gets only ID
      const res = await updateStatus(bookingId, "cancelled");
      if (res.ok) {
        toast.success("Booking cancelled!");
        refresh();
      } else {
        toast.error(res.error || "Failed to cancel booking");
      }
    },
    [updateStatus, refresh]
  );


  const handleAddBooking = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  const handleEditBooking = (bookingData) => {
    setEditingBooking(bookingData); // might be list-only or list+details
    setShowModal(true);
  };

  const handleFormSubmit = useCallback(
    async ({ payload, reset, error: errMsg }) => {
      if (errMsg) return toast.error(errMsg);

      if (editingBooking) {
        const res = await update(editingBooking._id, payload);
        if (res.ok) {
          toast.success("Booking updated successfully!");
          reset?.();
          setShowModal(false);
          setEditingBooking(null);
          refresh();
        } else toast.error(res.error || "Failed to update booking");
      } else {
        const res = await create(payload);
        if (res.ok) {
          toast.success("Booking created successfully!");
          reset?.();
          setShowModal(false);
          refresh();
        } else toast.error(res.error || "Failed to create booking");
      }
    },
    [create, update, editingBooking, refresh]
  );

  // ---------- PARAMS SUMMARY ----------
  const params = useMemo(() => {
    if (backendParams) {
      return {
        search: backendParams.search,
        fromDate: backendParams.fromDate,
        toDate: backendParams.toDate,
        services: backendParams.services,
        user: backendParams.user,
        sortBy: backendParams.sortBy,
        sortDir: backendParams.sortDir,
        perPage: backendParams.perPage ?? backendParams.limit,
        page: backendParams.page,
      };
    }
    return { ...preBookingParams, perPage: preBookingParams.limit, page };
  }, [backendParams, preBookingParams, page]);

  // ---------- UI ----------
  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 drop-shadow-sm">
        Pre-Booking
      </h1>

      {/* Filters */}
      <div className="mb-3 space-y-3 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={draft.search}
            onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="date"
            value={draft.fromDate}
            onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="date"
            value={draft.toDate}
            onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
          />
          <select
            value={draft.services}
            onChange={(e) => setDraft((d) => ({ ...d, services: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            disabled={loadingServices}
          >
            <option value="">
              {loadingServices ? "Loading..." : "All Services"}
            </option>
            {servicesError ? (
              <option disabled value="">
                Failed to load services
              </option>
            ) : (
              serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
          <select
            value={draft.user}
            onChange={(e) => setDraft((d) => ({ ...d, user: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            disabled={loadingUsers}
          >
            <option value="">
              {loadingUsers ? "Loading..." : "All Users"}
            </option>
            {usersError ? (
              <option disabled value="">
                Failed to load users
              </option>
            ) : (
              userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            <select
              value={draft.sortBy}
              onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={draft.sortDir}
              onChange={(e) => setDraft((d) => ({ ...d, sortDir: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <select
              value={draft.limit}
              onChange={(e) =>
                setDraft((d) => ({ ...d, limit: Number(e.target.value) }))
              }
              className="border rounded px-3 py-2 w-full"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 md:ml-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Params Summary */}
      <ParamsSummary params={params} serviceMap={serviceMap} userMap={userMap} />


      {/* Booking Table */}
      {loadingList ? (
        <div className="bg-white rounded-xl shadow-md border p-6 flex items-center justify-center gap-3">
          <InlineSpinner />
          <span className="text-gray-500 text-lg">Loading bookings…</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md shadow-sm">
          No bookings found matching your criteria.
        </div>
      ) : (
        <BookingsTable
          bookings={bookings}
          onUpdate={handleUpdate}
          onCarIn={handleCarIn}
          onCancelled={handleCancelled}
          onEdit={handleEditBooking}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-700">Total Bookings: {totalItems}</p>
        <div className="flex items-center gap-4">
          <button
            disabled={!hasPrevPage}
            onClick={() => hasPrevPage && setPage(page - 1)}
            className={`px-3 py-1 rounded ${hasPrevPage
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={!hasNextPage}
            onClick={() => hasNextPage && setPage(page + 1)}
            className={`px-3 py-1 rounded ${hasNextPage
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            Next
          </button>
        </div>
      </div>

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
