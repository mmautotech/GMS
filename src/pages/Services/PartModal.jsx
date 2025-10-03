// src/components/PartModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";
import PartsApi from "../../lib/api/partsApi.js";
import { toast } from "react-toastify";

export default function PartModal({ isOpen, onClose, part = null, onSaved }) {
    const [formData, setFormData] = useState({
        partName: "",
        partNumber: "",
        description: "",
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const firstInvalidRef = useRef(null);

    // Reset form when modal opens
    useEffect(() => {
        if (part) {
            setFormData({
                partName: part.partName || "",
                partNumber: part.partNumber || "",
                description: part.description || "",
            });
        } else {
            setFormData({ partName: "", partNumber: "", description: "" });
        }
        setErrors({});
    }, [part, isOpen]);

    // Escape closes modal
    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && !saving && onClose();
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose, saving]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // clear field error
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.partName.trim()) newErrors.partName = "Part Name is required";
        if (formData.partNumber && !/^[A-Za-z0-9-]+$/.test(formData.partNumber)) {
            newErrors.partNumber = "Part Number can only contain letters, numbers, or dashes";
        }
        if (formData.description.length > 200) {
            newErrors.description = "Description cannot exceed 200 characters";
        }
        return newErrors;
    };

    const handleSave = useCallback(async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // focus first invalid field
            const firstKey = Object.keys(validationErrors)[0];
            firstInvalidRef.current?.querySelector(`[name="${firstKey}"]`)?.focus();
            return;
        }

        setSaving(true);
        try {
            let res;
            if (part?._id) {
                res = await PartsApi.updatePart(part._id, formData);
            } else {
                res = await PartsApi.createPart(formData);
            }

            if (res?.success) {
                toast.success(`✅ Part ${part ? "updated" : "created"} successfully`);
                onSaved?.(res.part);
                onClose();
            } else {
                setErrors({ global: res?.error || "Failed to save part" });
            }
        } catch (err) {
            console.error(err);
            setErrors({ global: "Unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    }, [formData, part, onSaved, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            onClick={() => !saving && onClose()}
        >
            <div
                ref={firstInvalidRef}
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    disabled={saving}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-center mb-6">
                    {part ? "Edit Part" : "Create Part"}
                </h2>

                {/* Global error */}
                {errors.global && (
                    <div className="mb-4 text-red-600 text-sm text-center">{errors.global}</div>
                )}

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Part Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="partName"
                            value={formData.partName}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${errors.partName
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                            disabled={saving}
                        />
                        {errors.partName && (
                            <p className="text-xs text-red-500 mt-1">{errors.partName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Part Number</label>
                        <input
                            type="text"
                            name="partNumber"
                            value={formData.partNumber}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${errors.partNumber
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                            disabled={saving}
                        />
                        {errors.partNumber && (
                            <p className="text-xs text-red-500 mt-1">{errors.partNumber}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            maxLength={200}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none resize-none ${errors.description
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                            disabled={saving}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                        )}
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                        disabled={saving}
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : part ? (
                            "Update"
                        ) : (
                            "Create"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
