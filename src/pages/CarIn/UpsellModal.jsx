// src/pages/CarIn/UpsellModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { UpsellApi } from "../../lib/api";
import useServices from "../../hooks/useServices.js";

export default function UpsellModal({ isOpen, onClose, booking, onSaved }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        serviceId: "",
        partPrice: "",
        labourPrice: "",
        upsellPrice: "",
        upsellPhoto: "",
        userEditedUpsell: false,
    });

    const { list: services, loading: svcLoading, error: svcError } = useServices({ enabled: true });

    const availableServices = useMemo(() => {
        if (!booking?.services || !services) return services || [];
        const bookedServiceNames = booking.services.map(s => s.name || s.label || s);
        return services.filter(s => !bookedServiceNames.includes(s.name || s.label));
    }, [booking?.services, services]);

    // Auto-calc upsell price unless manually edited
    useEffect(() => {
        const part = Number(form.partPrice) || 0;
        const labour = Number(form.labourPrice) || 0;
        const autoPrice = part + labour;
        if (!form.userEditedUpsell) {
            setForm(prev => ({ ...prev, upsellPrice: autoPrice.toString() }));
        }
    }, [form.partPrice, form.labourPrice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpsellChange = (e) => {
        setForm(prev => ({ ...prev, upsellPrice: e.target.value, userEditedUpsell: true }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setForm(prev => ({ ...prev, upsellPhoto: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!booking?._id) return alert("No booking selected");
        if (!form.upsellPhoto) return alert("Upsell confirmation photo is required");

        setLoading(true);
        try {
            const upsell = await UpsellApi.createUpsell(booking._id, {
                serviceId: form.serviceId,
                partsCost: Number(form.partPrice) || 0,
                labourCost: Number(form.labourPrice) || 0,
                upsellPrice: Number(form.upsellPrice) || 0,
                upsellConfirmationPhoto: form.upsellPhoto,
            });
            if (onSaved) onSaved(upsell);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create upsell");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md md:max-w-lg p-6 sm:p-8 relative animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    Add Upsell
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Service Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Service</label>
                        <select
                            className="w-full border rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.serviceId}
                            onChange={(e) => setForm(prev => ({ ...prev, serviceId: e.target.value }))}
                            required
                            disabled={svcLoading}
                        >
                            <option value="">
                                {svcLoading ? "Loading services..." : "Select service"}
                            </option>
                            {availableServices.map(s => (
                                <option key={s.id || s._id} value={s.id || s._id}>
                                    {s.name || s.label}
                                </option>
                            ))}
                        </select>
                        {svcError && (
                            <p className="text-sm text-red-600 mt-1">Failed to load services</p>
                        )}
                        {availableServices.length === 0 && !svcLoading && (
                            <p className="text-sm text-gray-600 mt-1">All services already booked</p>
                        )}
                    </div>

                    {/* Prices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Part Price</label>
                            <input
                                type="number"
                                name="partPrice"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.partPrice}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Labour Price</label>
                            <input
                                type="number"
                                name="labourPrice"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.labourPrice}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Upsell Price</label>
                            <input
                                type="number"
                                name="upsellPrice"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.upsellPrice}
                                onChange={handleUpsellChange}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Confirmation Photo
                        </label>
                        <p className="text-xs text-gray-500 mb-1">
                            Upload a file or click <strong>Paste Image</strong> to paste from clipboard.
                        </p>

                        <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="border border-gray-300 rounded-lg p-2 flex-1 text-sm"
                                required={!form.upsellPhoto}
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const clipboardItems = await navigator.clipboard.read();
                                        for (const item of clipboardItems) {
                                            if (!item.types.includes("image/png") && !item.types.includes("image/jpeg")) continue;
                                            const blob = await item.getType(item.types[0]);
                                            const reader = new FileReader();
                                            reader.onload = (e) =>
                                                setForm(prev => ({ ...prev, upsellPhoto: e.target.result }));
                                            reader.readAsDataURL(blob);
                                            break;
                                        }
                                    } catch (err) {
                                        console.error("Failed to paste image:", err);
                                        alert("No image found in clipboard or browser does not support clipboard API.");
                                    }
                                }}
                                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm text-gray-700 transition"
                            >
                                Paste Image
                            </button>
                        </div>

                        {form.upsellPhoto && (
                            <img
                                src={form.upsellPhoto}
                                alt="Preview"
                                className="mt-3 w-full h-40 sm:h-48 object-contain border rounded-lg"
                            />
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Upsell"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
