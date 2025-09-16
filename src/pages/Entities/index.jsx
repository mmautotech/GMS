// src/pages/EntityPage.jsx
import React, { useState, useEffect } from "react";

import {
    getServices,
    createService,
    updateService,
    deleteService,
} from "../../lib/api/servicesApi.js";

// ✅ Config: which fields to show per entity
const fieldConfig = {
    service: [{ key: "name", label: "Service Name" }],
};

export default function EntityPage() {
    const [services, setServices] = useState([]);
    const [searchServices, setSearchServices] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // only "service"
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [selectEntityOpen, setSelectEntityOpen] = useState(false);

    // --- Load data ---
    useEffect(() => {
        getServices().then(setServices);
    }, []);

    // --- Helpers ---
    const filterItems = (items, query, field) =>
        items.filter((i) => i[field]?.toLowerCase().includes(query.toLowerCase()));

    const openModal = (type, data = {}, mode = "view") => {
        setModalType(type);
        setFormData(data);
        setIsEditing(mode === "edit");
        setIsCreating(mode === "create");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setFormData({});
        setIsEditing(false);
        setIsCreating(false);
    };

    // --- Save ---
    const handleSave = async () => {
        try {
            if (modalType === "service") {
                if (isCreating) await createService(formData);
                else await updateService(formData._id, formData);
                setServices(await getServices());
            }
            closeModal();
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    const handleDelete = async () => {
        if (!formData._id) return;
        try {
            if (modalType === "service") {
                await deleteService(formData._id);
                setServices(await getServices());
            }
            closeModal();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Entity Management</h1>

            {/* Add Button */}
            <button
                onClick={() => setSelectEntityOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                + Add
            </button>

            {/* Select Entity Modal */}
            {selectEntityOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-lg font-bold mb-4">Select Entity Type</h2>
                        <button
                            className="block w-full text-left px-4 py-2 mb-2 border rounded hover:bg-gray-100"
                            onClick={() => {
                                setSelectEntityOpen(false);
                                openModal("service", {}, "create");
                            }}
                        >
                            Service
                        </button>
                        <button
                            onClick={() => setSelectEntityOpen(false)}
                            className="mt-2 bg-gray-300 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Services List */}
            <div className="border rounded p-3 max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">Services</h3>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchServices}
                    onChange={(e) => setSearchServices(e.target.value)}
                    className="border p-1 mb-2 w-full rounded"
                />
                {filterItems(services, searchServices, "name").map((srv) => (
                    <div
                        key={srv._id}
                        className="border-b py-1 cursor-pointer hover:bg-gray-100"
                        onClick={() => openModal("service", srv, "view")}
                    >
                        {srv.name}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        {isCreating || isEditing ? (
                            <>
                                <h2 className="text-xl font-bold mb-4">
                                    {isCreating ? "Create" : "Edit"} Service
                                </h2>
                                {fieldConfig[modalType].map(({ key, label }) => (
                                    <div key={key} className="mb-3">
                                        <label className="block text-sm mb-1">{label}</label>
                                        <input
                                            type="text"
                                            value={formData[key] || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [key]: e.target.value })
                                            }
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                ))}
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-300 px-4 py-2 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-4">Service Details</h2>
                                {fieldConfig[modalType].map(({ key, label }) => (
                                    <div key={key} className="mb-2">
                                        <strong>{label}: </strong> {formData[key] || "-"}
                                    </div>
                                ))}
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-500 text-white px-4 py-2 rounded"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-300 px-4 py-2 rounded"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
