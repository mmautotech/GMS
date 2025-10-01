import React, { useState } from "react";
import { toast } from "react-toastify";
import PartsApi from "../../lib/api/partsApi.js";

export default function CreatePartModal({ isOpen, onClose }) {
    const [form, setForm] = useState({
        partName: "",
        partNumber: "",
        price: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                partName: form.partName,
                partNumber: form.partNumber || null,
                price: Number(form.price),
                description: form.description || null,
            };

            const res = await PartsApi.createPart(payload);

            if (res.success) {
                toast.success("✅ Part created successfully!");
                onClose();
            } else {
                toast.error(`❌ ${res.error || "Failed to create part"}`);
            }
        } catch (err) {
            toast.error(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Create New Part</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        name="partName"
                        placeholder="Part Name"
                        value={form.partName}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />

                    <input
                        type="text"
                        name="partNumber"
                        placeholder="Part Number (optional)"
                        value={form.partNumber}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={form.price}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border px-3 py-2 rounded"
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Description (optional)"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
