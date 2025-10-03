// src/pages/EntityPage.jsx
import React, { useState, useCallback } from "react";
import { Plus, Edit2, Trash2, RotateCcw, Search } from "lucide-react";
import { toast } from "react-toastify";

import useServices from "../../hooks/useServices.js";
import { useParts } from "../../hooks/useParts.js";
import ServiceApi from "../../lib/api/serviceApi.js";
import PartsApi from "../../lib/api/partsApi.js";
import ServiceModal from "./ServiceModal.jsx";
import PartModal from "./PartModal.jsx";

export default function EntityPage() {
    const [searchServices, setSearchServices] = useState("");
    const [searchParts, setSearchParts] = useState("");
    const [selectedService, setSelectedService] = useState(null);
    const [servicePartsCache, setServicePartsCache] = useState({});
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [partModalOpen, setPartModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [editingPart, setEditingPart] = useState(null);

    // ✅ Hooks
    const {
        list: services,
        refresh: refreshServices,
        loading: loadingServices,
        getPartsCountById,
    } = useServices();
    const {
        parts,
        refetch: refreshParts,
        loading: loadingParts,
    } = useParts();

    // 🔹 Fetch parts for selected service with cache
    const fetchServiceParts = useCallback(async (serviceId) => {
        if (servicePartsCache[serviceId]) {
            return; // already cached
        }
        try {
            const res = await ServiceApi.getServiceParts(serviceId);
            if (res.success) {
                setServicePartsCache((prev) => ({
                    ...prev,
                    [serviceId]: res.parts || [],
                }));
            }
        } catch (err) {
            console.error("Failed to fetch service parts:", err);
            toast.error("❌ Failed to load service parts");
            setServicePartsCache((prev) => ({ ...prev, [serviceId]: [] }));
        }
    }, [servicePartsCache]);

    // Filters
    const filteredServices = services.filter((s) =>
        s.name?.toLowerCase().includes(searchServices.toLowerCase())
    );

    const activeParts = selectedService
        ? servicePartsCache[selectedService._id] || []
        : parts;

    const filteredParts = activeParts.filter((p) =>
        p.partName?.toLowerCase().includes(searchParts.toLowerCase())
    );

    // --- Handlers ---
    const handleDeleteService = async (srv) => {
        try {
            await ServiceApi.deleteService(srv._id);
            toast.success(`✅ Service "${srv.name}" disabled`);
            refreshServices();
        } catch (err) {
            toast.error("❌ Failed to disable service");
        }
    };

    const handleActivateService = async (srv) => {
        try {
            await ServiceApi.activateService(srv._id);
            toast.success(`✅ Service "${srv.name}" reactivated`);
            refreshServices();
        } catch (err) {
            toast.error("❌ Failed to reactivate service");
        }
    };

    const handleTogglePart = async (part, serviceId) => {
        try {
            if (part.isActive) {
                await PartsApi.deactivatePart(part._id);
                toast.info(`⚠️ Part "${part.partName}" deactivated`);
            } else {
                await PartsApi.activatePart(part._id);
                toast.success(`✅ Part "${part.partName}" activated`);
            }
            if (serviceId) {
                // refresh cache for this service only
                const res = await ServiceApi.getServiceParts(serviceId);
                setServicePartsCache((prev) => ({
                    ...prev,
                    [serviceId]: res.parts || [],
                }));
            } else {
                refreshParts();
            }
            refreshServices();
        } catch (err) {
            toast.error("❌ Failed to update part");
        }
    };

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ---------------- Services Section ---------------- */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Services</h1>
                    <button
                        onClick={() => {
                            setEditingService(null);
                            setServiceModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md transition"
                    >
                        <Plus size={18} /> Add Service
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Services..."
                        value={searchServices}
                        onChange={(e) => setSearchServices(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                    Service Name
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                                    Parts Count
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                                    Active
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                    </table>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="min-w-full bg-white">
                            <tbody>
                                {loadingServices ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            Loading services...
                                        </td>
                                    </tr>
                                ) : filteredServices.length ? (
                                    filteredServices.map((srv, idx) => (
                                        <tr
                                            key={srv._id}
                                            className={`cursor-pointer hover:bg-blue-50 transition ${selectedService?._id === srv._id
                                                ? "bg-blue-100"
                                                : idx % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50/50"
                                                }`}
                                        >
                                            {/* 🔹 clicking name loads all parts */}
                                            <td
                                                className="px-6 py-4 text-gray-800"
                                                onClick={() => {
                                                    setSelectedService(srv);
                                                    fetchServiceParts(srv._id);
                                                }}
                                            >
                                                <div className="font-medium underline text-blue-600 cursor-pointer">
                                                    {srv.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(srv.createdAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getPartsCountById(srv._id)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={srv.enabled}
                                                    readOnly
                                                    className="w-5 h-5 accent-blue-600"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingService(srv);
                                                        setServiceModalOpen(true);
                                                    }}
                                                    className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {srv.enabled ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteService(srv);
                                                        }}
                                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActivateService(srv);
                                                        }}
                                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No services found.{" "}
                                            <button
                                                onClick={() => setServiceModalOpen(true)}
                                                className="text-blue-600 underline ml-1"
                                            >
                                                Add one now
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ---------------- Parts Section ---------------- */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {selectedService ? `Parts for: ${selectedService.name}` : "All Parts"}
                    </h1>

                    <div className="flex gap-2">
                        {selectedService && (
                            <button
                                onClick={() => setSelectedService(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow"
                            >
                                ← Back to All
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setEditingPart(null);
                                setPartModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md transition"
                        >
                            <Plus size={18} /> Add Part
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Parts..."
                        value={searchParts}
                        onChange={(e) => setSearchParts(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>


                {/* Table */}
                <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                    Part Name (Part Number)
                                    <div className="text-xs text-gray-400">Description</div>
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                                    Active
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                    </table>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="min-w-full bg-white">
                            <tbody>
                                {loadingParts && !selectedService ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            Loading parts...
                                        </td>
                                    </tr>
                                ) : filteredParts.length ? (
                                    filteredParts.map((p, idx) => (
                                        <tr
                                            key={p._id}
                                            className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                }`}
                                        >
                                            <td className="px-6 py-4 text-gray-800">
                                                <div className="font-medium">
                                                    {p.partName}{" "}
                                                    {p.partNumber && (
                                                        <span className="text-gray-500">
                                                            ({p.partNumber})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {p.description || ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.isActive}
                                                    readOnly
                                                    className="w-5 h-5 accent-blue-600"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingPart(p);
                                                        setPartModalOpen(true);
                                                    }}
                                                    className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleTogglePart(p, selectedService?._id)
                                                    }
                                                    className={`p-2 ${p.isActive
                                                        ? "bg-red-500 hover:bg-red-600"
                                                        : "bg-green-500 hover:bg-green-600"
                                                        } text-white rounded-lg`}
                                                >
                                                    {p.isActive ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            No parts found.{" "}
                                            <button
                                                onClick={() => {
                                                    setEditingService(selectedService);
                                                    setServiceModalOpen(true);
                                                }}
                                                className="text-blue-600 underline ml-1"
                                            >
                                                Add one now
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ---------------- Modals ---------------- */}
            <ServiceModal
                isOpen={serviceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                service={editingService}
                onSaved={() => refreshServices()}
            />

            <PartModal
                isOpen={partModalOpen}
                onClose={() => setPartModalOpen(false)}
                part={editingPart}
                onSaved={(savedPart) => {
                    if (selectedService) {
                        setServicePartsCache((prev) => {
                            const current = prev[selectedService._id] || [];
                            const exists = current.find((p) => p._id === savedPart._id);
                            return {
                                ...prev,
                                [selectedService._id]: exists
                                    ? current.map((p) => (p._id === savedPart._id ? savedPart : p))
                                    : [...current, savedPart],
                            };
                        });
                        refreshServices();
                    } else {
                        refreshParts();
                    }
                }}
            />
        </div>
    );
}
