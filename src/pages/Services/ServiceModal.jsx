// src/components/ServiceModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select"; // ✅ searchable dropdown
import ServiceApi from "../../lib/api/serviceApi.js";
import PartsApi from "../../lib/api/partsApi.js";

export default function ServiceModal({ isOpen, onClose, service = null, onSaved }) {
    const [formData, setFormData] = useState({ name: "", parts: [] });
    const [parts, setParts] = useState([]); // dropdown list from backend
    const [saving, setSaving] = useState(false);

    // 🔹 Load parts dropdown when modal opens
    useEffect(() => {
        const loadParts = async () => {
            const res = await PartsApi.getPartsDropdown();
            if (res.success) {
                // react-select needs { value, label }
                setParts((res.parts || []).map((p) => ({
                    value: p.id || p._id,
                    label: p.label,
                })));
            } else {
                toast.error("❌ Failed to load parts list");
            }
        };
        if (isOpen) loadParts();
    }, [isOpen]);

    // 🔹 Load service values into form
    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || "",
                parts: service.parts?.map((p) =>
                    typeof p === "string"
                        ? p
                        : p._id || p.id
                ) || [],
            });
        } else {
            setFormData({ name: "", parts: [] });
        }
    }, [service, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePartsChange = (selectedOptions) => {
        setFormData((prev) => ({
            ...prev,
            parts: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
        }));
    };

    const handleSave = async () => {
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error("⚠️ Service name is required");
            return;
        }
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            toast.error("⚠️ Service name must be 2–50 characters long");
            return;
        }
        if (!Array.isArray(formData.parts)) {
            toast.error("⚠️ Parts must be an array");
            return;
        }

        setSaving(true);
        try {
            let res;
            if (service?._id) {
                res = await ServiceApi.updateService(service._id, {
                    ...formData,
                    name: trimmedName,
                });
            } else {
                res = await ServiceApi.createService({
                    ...formData,
                    name: trimmedName,
                });
            }

            if (res.success) {
                toast.success(res.message || (service ? "✅ Service updated" : "✅ Service created"));
                onSaved?.(res.service);
                onClose();
            } else {
                toast.error(res.error || "❌ Failed to save service");
            }
        } catch (err) {
            console.error(err);
            toast.error("❌ Unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Pre-select already chosen parts
    const selectedParts = parts.filter((p) => formData.parts.includes(p.value));

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    disabled={saving}
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-center mb-6">
                    {service ? "Edit Service" : "Create Service"}
                </h2>

                <div className="space-y-4">
                    {/* Service Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Service Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Service"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={saving}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                    </div>

                    {/* Parts Multi-select with Search */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Parts</label>
                        <Select
                            isMulti
                            isDisabled={saving}
                            options={parts}
                            value={selectedParts}
                            onChange={handlePartsChange}
                            placeholder="Choose parts..."
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                        <div className="flex justify-end mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {formData.parts.length} selected
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : service ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}
