// src/pages/PreBooking/BookingForm.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseNum, numberFmt, percentFmt } from "../../utils/fmt.js";
import Select from "react-select";
import toast from "react-hot-toast";
import useServiceOptions from "../../hooks/useServiceOptions.js"; // ✅ switched


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
  bookingConfirmationPhoto: "",
  bookingDate: "",
  _newPhoto: false,
};


export default function BookingForm({ loading, onSubmit, onCancel, initialData }) {
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(EMPTY);


  const { list: serviceOptions, loading: svcLoading, error: svcError } = useServiceOptions({ useSessionCache: true });


  const selectOptions = useMemo(
    () => (serviceOptions || []).map((s) => ({ value: s.id, label: s.name })),
    [serviceOptions]
  );


  useEffect(() => {
    if (initialData) {
      const normalized = {
        ...EMPTY,
        ...initialData,
        vehicleRegNo: initialData.vehicleRegNo || initialData.registration || "",
        ownerPostalCode: initialData.ownerPostalCode || initialData.postCode || "",
        ownerNumber: initialData.ownerNumber || initialData.phoneNumber || "",
        ownerEmail: initialData.ownerEmail || initialData.email || "",
        prebookingBookingPrice: initialData.prebookingBookingPrice || initialData.bookingPrice || "",
        prebookingLabourCost: initialData.prebookingLabourCost || initialData.labourCost || "",
        prebookingPartsCost: initialData.prebookingPartsCost || initialData.partsCost || "",
        scheduledDate: initialData.scheduledDate ? new Date(initialData.scheduledDate).toISOString().slice(0, 10) : "",
        bookingDate: initialData.bookingDate ? new Date(initialData.bookingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        prebookingServices: Array.isArray(initialData.prebookingServices || initialData.services)
          ? (initialData.prebookingServices || initialData.services).map((s) => ({
            value: s._id || s.value || s,
            label: s.label || s.name || s.serviceName || s,
          }))
          : [],
        bookingConfirmationPhoto: initialData.bookingConfirmationPhoto || initialData.compressedPhoto || "",
        _newPhoto: false,
      };
      setForm(normalized);
      setOriginal(normalized);
    } else {
      const fresh = { ...EMPTY, bookingDate: new Date().toISOString().slice(0, 10) };
      setForm(fresh);
      setOriginal(fresh);
    }
  }, [initialData]);


  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);


  const handleServicesChange = (selected) => setForm((f) => ({ ...f, prebookingServices: selected || [] }));


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;


    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB)");
      return;
    }


    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, bookingConfirmationPhoto: reader.result, _newPhoto: true }));
    reader.readAsDataURL(file);
  };


  // Paste handler
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;


    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Pasted image is too large (max 5 MB)");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((f) => ({ ...f, bookingConfirmationPhoto: reader.result, _newPhoto: true }));
          toast.success("Image pasted successfully!");
        };
        reader.readAsDataURL(file);
        break; // Only first image
      }
    }
  }, []);


  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);


  const { profit, profitPct } = useMemo(() => {
    const price = parseNum(form.prebookingBookingPrice);
    const labour = parseNum(form.prebookingLabourCost);
    const parts = parseNum(form.prebookingPartsCost);
    const cost = labour + parts;
    const pf = price - cost;
    const pct = price > 0 ? (pf / price) * 100 : 0;
    return { profit: pf, profitPct: pct };
  }, [form.prebookingBookingPrice, form.prebookingLabourCost, form.prebookingPartsCost]);


  const buildDiffPayload = (form, original) => {
    const diff = {};
    for (const key in form) {
      if (key === "bookingDate" || key === "_newPhoto") continue;
      const val = form[key];
      const orig = original[key];


      if (Array.isArray(val)) {
        const valIds = val.map((v) => v.value || v);
        const origIds = Array.isArray(orig) ? orig.map((v) => v.value || v) : [];
        if (valIds.length !== origIds.length || !valIds.every((v, i) => v === origIds[i])) diff["prebookingServices"] = valIds;
      } else if (key === "bookingConfirmationPhoto") {
        if (form._newPhoto) diff.bookingConfirmationPhoto = val;
      } else if (val !== orig) {
        switch (key) {
          case "ownerPostalCode":
          case "ownerNumber":
          case "ownerEmail":
            diff[key] = String(val).trim();
            break;
          case "prebookingBookingPrice":
          case "prebookingLabourCost":
          case "prebookingPartsCost":
            diff[key] = parseNum(val);
            break;
          default:
            diff[key] = val;
        }
      }
    }
    return diff;
  };


  const isDirty = useMemo(() => {
    if (!initialData) return true;
    const diff = buildDiffPayload(form, original);
    return Object.keys(diff).length > 0;
  }, [form, original, initialData]);


  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      let payload;
      if (initialData) {
        payload = buildDiffPayload(form, original);
        if (Object.keys(payload).length === 0) {
          toast("No changes detected", { icon: "ℹ️" });
          return;
        }
      } else {
        payload = {
          vehicleRegNo: form.vehicleRegNo.trim(),
          makeModel: form.makeModel.trim(),
          ownerName: form.ownerName.trim(),
          ownerAddress: form.ownerAddress.trim(),
          ownerPostalCode: form.ownerPostalCode.trim(),
          ownerNumber: String(form.ownerNumber).trim(),
          ownerEmail: String(form.ownerEmail).trim(),
          source: String(form.source).trim(),
          scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : new Date().toISOString(),
          prebookingBookingPrice: parseNum(form.prebookingBookingPrice),
          prebookingLabourCost: parseNum(form.prebookingLabourCost),
          prebookingPartsCost: parseNum(form.prebookingPartsCost),
          prebookingServices: form.prebookingServices.map((s) => s.value),
          remarks: form.remarks,
          bookingConfirmationPhoto: form.bookingConfirmationPhoto,
        };
      }
      onSubmit({
        payload,
        reset: () => {
          setOriginal(form);
          setForm((f) => ({ ...f, _newPhoto: false }));
          toast.success(initialData ? "Booking updated!" : "Booking saved!");
        },
      });
    },
    [form, original, onSubmit, initialData]
  );


  const handleReset = useCallback(() => {
    setForm((f) => ({ ...original, _newPhoto: false }));
    toast("Form reset", { icon: "🔄" });
  }, [original]);


  return (
    <div className="h-[600px] overflow-y-auto p-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-blue-100 mb-6 bg-white"
      >
        {/* Booking Date */}
        <input type="date" value={form.bookingDate} readOnly className="border border-gray-300 rounded p-2 bg-gray-100 cursor-not-allowed" aria-label="Booking Date" tabIndex={-1} />


        {/* Basic Info */}
        <input autoComplete="off" maxLength={15} type="text" name="vehicleRegNo" placeholder="Reg No." value={form.vehicleRegNo} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input autoComplete="off" type="text" name="makeModel" placeholder="Make & Model" value={form.makeModel} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input type="text" name="ownerName" placeholder="Owner Name" value={form.ownerName} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input type="text" name="ownerAddress" placeholder="Owner Address" value={form.ownerAddress} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input maxLength={10} type="text" name="ownerPostalCode" placeholder="Post Code" value={form.ownerPostalCode} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input type="tel" name="ownerNumber" placeholder="Phone Number" value={form.ownerNumber} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input type="text" name="source" placeholder="Source" value={form.source} onChange={handleChange} className="border border-gray-300 rounded p-2" required />
        <input autoComplete="off" type="email" name="ownerEmail" placeholder="Email" value={form.ownerEmail} onChange={handleChange} className="border border-gray-300 rounded p-2 w-full md:col-span-2" required />


        {/* Services */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">Select Services</label>
          <Select isMulti options={selectOptions} value={form.prebookingServices} onChange={handleServicesChange} placeholder={svcLoading ? "Loading services..." : "Choose services..."} className="text-sm" classNamePrefix="select" noOptionsMessage={() => (svcError ? "Failed to load services" : "No services available")} isDisabled={svcLoading} />
        </div>


        {/* Pricing & Profit */}
        <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} className="border border-gray-300 rounded p-2" aria-label="Scheduled Date" />
        <input type="number" name="prebookingBookingPrice" placeholder="Booking Price" value={form.prebookingBookingPrice} onChange={handleChange} className="border border-gray-300 rounded p-2" min="0" step="0.01" required />
        <input type="number" name="prebookingLabourCost" placeholder="Labour Cost" value={form.prebookingLabourCost} onChange={handleChange} className="border border-gray-300 rounded p-2" min="0" step="0.01" required />
        <input type="number" name="prebookingPartsCost" placeholder="Parts Cost" value={form.prebookingPartsCost} onChange={handleChange} className="border border-gray-300 rounded p-2" min="0" step="0.01" required />
        <input type="text" name="profit" placeholder="Profit" value={numberFmt.format(profit)} readOnly className="border border-gray-300 rounded p-2 bg-gray-100" tabIndex={-1} />
        <input type="text" name="profitPercentage" placeholder="Profit %" value={percentFmt(profitPct)} readOnly className="border border-gray-300 rounded p-2 bg-gray-100" tabIndex={-1} />


        {/* Remarks */}
        <textarea name="remarks" placeholder="Remarks" value={form.remarks} onChange={handleChange} className="border border-gray-300 rounded p-2 md:col-span-2" rows={3} />


        {/* File / Paste Upload */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">Booking Confirmation Photo</label>
          <p className="text-sm text-gray-500 mb-1">You can upload by file or simply <strong>paste an image</strong> here.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border border-gray-300 rounded p-2 w-full"
            required={!initialData && !form.bookingConfirmationPhoto} // ✅ key fix
          />
          {form.bookingConfirmationPhoto && <img src={form.bookingConfirmationPhoto} alt="Preview" className="mt-2 h-32 object-contain border rounded" />}
        </div>


        {/* Actions */}
        <div className="md:col-span-2 flex gap-2 items-center">
          <button type="submit" className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold py-2 rounded hover:shadow-lg transition disabled:opacity-60" disabled={loading || (initialData && !isDirty)}>
            {loading ? "Saving..." : initialData ? "Update Booking" : "Save Booking"}
          </button>
          <button type="button" onClick={handleReset} className="px-4 py-2 border rounded hover:bg-gray-50" disabled={loading || (initialData && !isDirty)}>Reset</button>
          {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50" disabled={loading}>Cancel</button>}
          {initialData && isDirty && <span className="text-sm text-red-600 ml-2">Unsaved changes</span>}
        </div>
      </form>
    </div>
  );
}





