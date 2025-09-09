// src/pages/PreBooking/BookingForm.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseNum, numberFmt, percentFmt } from "../../utils/fmt.js";
import { getServices } from "../../lib/api/servicesApi.js";
import Select from "react-select";
import toast from "react-hot-toast";

const EMPTY = {
  vehicleRegNo: "",
  makeModel: "",
  ownerName: "",
  ownerAddress: "",
  ownerPostalCode: "",
  ownerNumber: "",
  ownerEmail: "",
  source: "",
  scheduledDate: "",
  prebookingServices: [],
  prebookingBookingPrice: "",
  prebookingLabourCost: "",
  prebookingPartsCost: "",
  remarks: "",
  bookingConfirmationPhoto: "" // base64 or file URL
};

export default function BookingForm({ loading, onSubmit, onCancel, initialData }) {
  const [form, setForm] = useState(EMPTY);
  const [serviceOptions, setServiceOptions] = useState([]);

  // --- Fetch service options ---
  useEffect(() => {
    (async () => {
      try {
        const res = await getServices();
        console.log("Fetched services:", res); // 👈 Debug log

        const options = (res || [])
          .filter((s) => s.enabled !== false) // keep enabled or missing flag
          .map((s) => ({
            value: s._id || s.id || s.value,
            label: s.name || s.serviceName || s.label || "Unnamed service",
          }));

        setServiceOptions(options);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        toast.error("Failed to fetch services.");
      }
    })();
  }, []);

  // --- Prefill form if editing ---
  useEffect(() => {
    if (initialData) {
      setForm({
        ...EMPTY,
        ...initialData,
        scheduledDate: initialData.scheduledDate
          ? new Date(initialData.scheduledDate).toISOString().slice(0, 10)
          : "",
        prebookingServices: Array.isArray(initialData.prebookingServices || initialData.services)
          ? (initialData.prebookingServices || initialData.services).map((s) => ({
            value: s._id || s.value || s,
            label: s.label || s.name || s.serviceName || s,
          }))
          : [],
        bookingConfirmationPhoto: initialData.bookingConfirmationPhoto || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  const handleServicesChange = (selected) =>
    setForm((f) => ({ ...f, prebookingServices: selected || [] }));

  // --- Handle file upload ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, bookingConfirmationPhoto: reader.result })); // store as base64
    };
    reader.readAsDataURL(file);
  };

  // --- Profit calculation ---
  const { profit, profitPct } = useMemo(() => {
    const price = parseNum(form.prebookingBookingPrice);
    const labour = parseNum(form.prebookingLabourCost);
    const parts = parseNum(form.prebookingPartsCost);
    const cost = labour + parts;
    const pf = price - cost;
    const pct = cost > 0 ? (pf / cost) * 100 : 0;
    return { profit: pf, profitPct: pct };
  }, [form.prebookingBookingPrice, form.prebookingLabourCost, form.prebookingPartsCost]);

  // --- Validation ---
  const validate = () => {
    const required = [
      "vehicleRegNo",
      "makeModel",
      "ownerName",
      "ownerAddress",
      "ownerPostalCode",
      "ownerNumber",
      "ownerEmail",
      "source",
      "prebookingServices",
      "prebookingBookingPrice",
      "prebookingLabourCost",
      "prebookingPartsCost",
      "remarks",
      "bookingConfirmationPhoto",
    ];
    const missing = required.filter((k) => !String(form[k]).trim());
    if (missing.length) return `Please fill: ${missing.join(", ")}`;
    if (form.ownerNumber && String(form.ownerNumber).replace(/\D/g, "").length < 7)
      return "Please enter a valid phone number.";
    if (!form.prebookingServices.length) return "Please select at least one service.";
    return "";
  };

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const problem = validate();
      if (problem) {
        toast.error(problem);
        return;
      }

      const payload = {
        vehicleRegNo: form.vehicleRegNo.trim(),
        makeModel: form.makeModel.trim(),
        ownerName: form.ownerName.trim(),
        ownerAddress: form.ownerAddress.trim(),
        ownerPostalCode: form.ownerPostalCode.trim(),
        ownerNumber: String(form.ownerNumber).trim(),
        ownerEmail: String(form.ownerEmail).trim(),
        source: String(form.source).trim(),
        scheduledDate: form.scheduledDate
          ? new Date(form.scheduledDate).toISOString()
          : new Date().toISOString(),
        prebookingBookingPrice: parseNum(form.prebookingBookingPrice),
        prebookingLabourCost: parseNum(form.prebookingLabourCost),
        prebookingPartsCost: parseNum(form.prebookingPartsCost),
        prebookingServices: form.prebookingServices.map((s) => s.value),
        remarks: form.remarks,
        bookingConfirmationPhoto: form.bookingConfirmationPhoto, // send base64 to backend
      };

      onSubmit({
        payload,
        reset: () => {
          setForm(EMPTY);
          toast.success("Booking saved successfully!");
        },
      });
    },
    [form, onSubmit]
  );

  const handleReset = useCallback(() => {
    setForm(initialData || EMPTY);
    toast("Form reset", { icon: "🔄" });
  }, [initialData]);

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-[600px] overflow-y-auto p-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-blue-100 mb-6 bg-white"
      >
        {/* Auto-filled created date */}
        <input
          type="date"
          value={todayISO}
          readOnly
          className="border border-gray-300 rounded p-2 bg-gray-100 cursor-not-allowed"
          aria-label="Pre-booked on (today)"
          tabIndex={-1}
        />

        {/* Basic Info */}
        <input
          type="text"
          name="vehicleRegNo"
          placeholder="Reg No."
          value={form.vehicleRegNo}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="text"
          name="makeModel"
          placeholder="Make & Model"
          value={form.makeModel}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="text"
          name="ownerName"
          placeholder="Owner Name"
          value={form.ownerName}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="text"
          name="ownerAddress"
          placeholder="Owner Address"
          value={form.ownerAddress}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="text"
          name="ownerPostalCode"
          placeholder="Post Code"
          value={form.ownerPostalCode}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="tel"
          name="ownerNumber"
          placeholder="Phone Number"
          value={form.ownerNumber}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="text"
          name="source"
          placeholder="Source"
          value={form.source}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          required
        />
        <input
          type="email"
          name="ownerEmail"
          placeholder="Email"
          value={form.ownerEmail}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2 w-full md:col-span-2"
          required
        />

        {/* Services Dropdown */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Select Services
          </label>
          <Select
            isMulti
            options={serviceOptions}
            value={form.prebookingServices}
            onChange={handleServicesChange}
            placeholder="Choose services..."
            className="text-sm"
            classNamePrefix="select"
            noOptionsMessage={() => "No services available"}
          />
        </div>

        {/* Pricing & Profit */}
        <input
          type="date"
          name="scheduledDate"
          value={form.scheduledDate}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          aria-label="Scheduled Date"
        />
        <input
          type="number"
          name="prebookingBookingPrice"
          placeholder="Booking Price"
          value={form.prebookingBookingPrice}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          min="0"
          step="0.01"
          required
        />
        <input
          type="number"
          name="prebookingLabourCost"
          placeholder="Labour Cost"
          value={form.prebookingLabourCost}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          min="0"
          step="0.01"
          required
        />
        <input
          type="number"
          name="prebookingPartsCost"
          placeholder="Parts Cost"
          value={form.prebookingPartsCost}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
          min="0"
          step="0.01"
          required
        />

        <input
          type="text"
          name="profit"
          placeholder="Profit"
          value={numberFmt.format(profit)}
          readOnly
          className="border border-gray-300 rounded p-2 bg-gray-100"
          tabIndex={-1}
        />
        <input
          type="text"
          name="profitPercentage"
          placeholder="Profit %"
          value={percentFmt(profitPct)}
          readOnly
          className="border border-gray-300 rounded p-2 bg-gray-100"
          tabIndex={-1}
        />

        {/* Remarks */}
        <input
          type="text"
          name="remarks"
          placeholder="Remarks"
          value={form.remarks}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2 md:col-span-2"
          required
        />

        {/* File Upload */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Booking Confirmation Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border border-gray-300 rounded p-2 w-full"
            required={!initialData}
          />
          {form.bookingConfirmationPhoto && (
            <img
              src={form.bookingConfirmationPhoto}
              alt="Preview"
              className="mt-2 h-32 object-contain border rounded"
            />
          )}
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold py-2 rounded hover:shadow-lg transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : initialData ? "Update Booking" : "Save Booking"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Reset
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
