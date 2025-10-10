import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
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

const SORT_OPTIONS = [
  { label: "Booking Date", value: "createdDate" },
  { label: "Arrival Date", value: "arrivedDate" },
  { label: "Registration No", value: "vehicleRegNo" },
  { label: "Make & Model", value: "makeModel" },
  { label: "Phone Number", value: "ownerNumber" },
  { label: "Post Code", value: "ownerPostalCode" },
];

const LIMIT_OPTIONS = [5, 25, 50, 100];

export default function PreBookingPage({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filters
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

  const preParams = useMemo(() => applied, [applied]);

  // Bookings
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
  } = usePreBookings(preParams);

  const { setError, updateStatus } = useBookings();
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

  // ─────────────── Handlers ───────────────
  const handleCarIn = useCallback(
    async (booking) => {
      if (
        !window.confirm(
          "Are you sure you want to mark this booking as ARRIVED (Car In)?"
        )
      )
        return;

      try {
        const res = await updateStatus(booking._id, "arrived");
        if (res.ok) {
          toast.success("🚗 Car checked in successfully!");
          await refresh();
        } else {
          toast.error(res.error || "Failed to mark car in");
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message;
        setError(msg);
        toast.error(msg || "Failed to mark car in");
      }
    },
    [updateStatus, refresh, setError]
  );

  const handleCancelled = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to CANCEL this booking?"))
        return;

      try {
        const res = await updateStatus(id, "cancelled");
        if (res.ok) {
          toast.success("❌ Booking cancelled successfully!");
          await refresh();
        } else {
          toast.error(res.error || "Failed to cancel booking");
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message;
        setError(msg);
        toast.error(msg || "Failed to cancel booking");
      }
    },
    [updateStatus, refresh, setError]
  );

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setShowForm(true);
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setSelectedBooking(null);
    await refresh();
  };

  // ─────────────── Filters ───────────────
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

  const params = useMemo(
    () =>
      backendParams
        ? {
          ...backendParams,
          perPage: backendParams.perPage ?? backendParams.limit,
          page,
        }
        : { ...preParams, perPage: preParams.limit, page },
    [backendParams, preParams, page]
  );

  // ─────────────── Auto Refresh on Focus / Return ───────────────
  useEffect(() => {
    let timeout;
    const handleFocus = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log("🔄 Refetch triggered on window focus (PreBooking)");
        refresh();
      }, 300);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        console.log("🔁 Refetch triggered on page visible (PreBooking)");
        refresh();
      }
    };

    // 🔹 Detect navigation back (via history)
    const unlisten = navigate((location) => {
      console.log("📄 Navigation detected:", location.pathname);
      refresh();
    });

    // Initial load
    refresh();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (unlisten) unlisten();
    };
  }, [refresh, navigate]);

  // ─────────────── UI ───────────────
  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Pre-Bookings</h1>

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
            onChange={(e) =>
              setDraft((d) => ({ ...d, fromDate: e.target.value }))
            }
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="date"
            value={draft.toDate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, toDate: e.target.value }))
            }
            className="border rounded px-3 py-2 w-full"
          />
          <select
            value={draft.services}
            onChange={(e) =>
              setDraft((d) => ({ ...d, services: e.target.value }))
            }
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
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))
            )}
          </select>
          <select
            value={draft.user}
            onChange={(e) =>
              setDraft((d) => ({ ...d, user: e.target.value }))
            }
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
              onChange={(e) =>
                setDraft((d) => ({ ...d, sortBy: e.target.value }))
              }
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
              onChange={(e) =>
                setDraft((d) => ({ ...d, sortDir: e.target.value }))
              }
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
      <ParamsSummary params={params} userMap={userMap} />

      {/* Table */}
      {loadingList ? (
        <InlineSpinner label="Loading pre-bookings…" />
      ) : (
        <BookingsTable
          bookings={bookings}
          onCarIn={handleCarIn}
          onCancelled={handleCancelled}
          onEdit={handleEdit}
          currentUser={currentUser}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-700">Total Pre-Bookings: {totalItems}</p>
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

      {/* Booking Form */}
      {showForm && (
        <BookingForm
          isOpen={true}
          onClose={handleFormClose}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}
