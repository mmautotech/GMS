// src/pages/EntityPage.jsx
import React, { useState, useEffect } from "react";
import ServiceApi from "../../lib/api/servicesApi.js"; // ✅ import default object
import { Plus, Edit2, Trash2, Search } from "lucide-react";

const fieldConfig = {
    service: [{ key: "name", label: "Service Name" }],
};

export default function EntityPage() {
    const [services, setServices] = useState([]);
    const [searchServices, setSearchServices] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        ServiceApi.getServices().then((res) => {
            if (res.success) setServices(res.services);
        });
    }, []);

    const filterItems = (items, query, field) =>
        items.filter((i) => i[field]?.toLowerCase().includes(query.toLowerCase()));

    const openModal = (data = {}, mode = "view") => {
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

    const handleSave = async () => {
        try {
            if (isCreating) await ServiceApi.createService(formData);
            else await ServiceApi.updateService(formData._id, formData);

            const res = await ServiceApi.getServices();
            if (res.success) setServices(res.services);

            closeModal();
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await ServiceApi.deleteService(id);
            const res = await ServiceApi.getServices();
            if (res.success) setServices(res.services);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Services</h1>
                <button
                    onClick={() => openModal({}, "create")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md transition"
                >
                    <Plus size={18} /> Add Service
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchServices}
                    onChange={(e) => setSearchServices(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            {/* Services List */}
            <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                Service Name
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterItems(services, searchServices, "name").map((srv, idx) => (
                            <tr
                                key={srv._id}
                                className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                    }`}
                            >
                                <td className="px-6 py-4 text-gray-800">{srv.name}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => openModal(srv, "edit")}
                                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(srv._id)}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {services.length === 0 && (
                            <tr>
                                <td
                                    colSpan="2"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    No services found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                        {isCreating || isEditing ? (
                            <>
                                <h2 className="text-xl font-bold mb-4">
                                    {isCreating ? "Create" : "Edit"} Service
                                </h2>
                                {fieldConfig.service.map(({ key, label }) => (
                                    <div key={key} className="mb-3">
                                        <label className="block text-sm font-medium mb-1">
                                            {label}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData[key] || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [key]: e.target.value })
                                            }
                                            className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-200 px-4 py-2 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        Save
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
