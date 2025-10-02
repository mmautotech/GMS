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

    // Load all services
    const { list: services, loading: svcLoading, error: svcError } = useServices({ enabled: true });

    // Exclude already booked services by name
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

            // Notify parent and refresh car data
            if (onSaved) onSaved(upsell);

            // Close modal
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Add Upsell</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Service dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Service</label>
                        <select
                            className="w-full border rounded p-2"
                            value={form.serviceId}
                            onChange={e => setForm(prev => ({ ...prev, serviceId: e.target.value }))}
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
                        {svcError && <p className="text-sm text-red-600 mt-1">Failed to load services</p>}
                        {availableServices.length === 0 && !svcLoading && (
                            <p className="text-sm text-gray-600 mt-1">All services already booked</p>
                        )}
                    </div>

                    {/* Part price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Part Price</label>
                        <input
                            type="number"
                            name="partPrice"
                            className="w-full border rounded p-2"
                            value={form.partPrice}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    {/* Labour price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Labour Price</label>
                        <input
                            type="number"
                            name="labourPrice"
                            className="w-full border rounded p-2"
                            value={form.labourPrice}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    {/* Upsell price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Upsell Price</label>
                        <input
                            type="number"
                            name="upsellPrice"
                            className="w-full border rounded p-2"
                            value={form.upsellPrice}
                            onChange={handleUpsellChange}
                            min="0"
                        />
                    </div>

                    {/* Photo upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirmation Photo</label>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} required />
                        {form.upsellPhoto && (
                            <img
                                src={form.upsellPhoto}
                                alt="Preview"
                                className="mt-2 w-32 h-32 object-cover border rounded"
                            />
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            className="px-4 py-2 border rounded"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Upsell"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
