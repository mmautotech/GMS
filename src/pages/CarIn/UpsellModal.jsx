// src/pages/CarIn/UpsellModal.jsx
import React, { useState, useEffect } from "react";
import { ServicesApi, UpsellApi } from "../../lib/api";

export default function UpsellModal({ isOpen, onClose, booking, onSaved }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        serviceId: "",
        partPrice: "",
        labourPrice: "",
        upsellPrice: "",
        userEditedUpsell: false,
    });

    // Load services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const serviceList = await ServicesApi.getServices();
                setServices(Array.isArray(serviceList) ? serviceList : serviceList.items || []);
            } catch (err) {
                console.error("Failed to fetch services", err);
                alert("Failed to load services");
            }
        };
        fetchServices();
    }, []);

    // Auto-calc upsell price (unless manually edited)
    useEffect(() => {
        const part = Number(form.partPrice) || 0;
        const labour = Number(form.labourPrice) || 0;
        const autoPrice = part + labour;

        if (!form.userEditedUpsell) {
            setForm((prev) => ({ ...prev, upsellPrice: autoPrice.toString() }));
        }
    }, [form.partPrice, form.labourPrice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpsellChange = (e) => {
        setForm((prev) => ({
            ...prev,
            upsellPrice: e.target.value,
            userEditedUpsell: true,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!booking?._id) {
            alert("No booking selected for upsell");
            return;
        }

        setLoading(true);
        try {
            const upsell = await UpsellApi.createUpsell(booking._id, {
                serviceId: form.serviceId,
                partsCost: Number(form.partPrice) || 0,
                labourCost: Number(form.labourPrice) || 0,
                upsellPrice: Number(form.upsellPrice) || 0,
            });

            onSaved?.(upsell);
            onClose();
        } catch (err) {
            console.error("Upsell creation failed", err.response?.data || err.message);
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
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, serviceId: e.target.value }))
                            }
                            required
                        >
                            <option value="">Select service</option>
                            {services.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
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