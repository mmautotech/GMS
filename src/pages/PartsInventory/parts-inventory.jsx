// src/pages/PartsInventory/parts-inventory.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Package, Plus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../ui/dialog";

import {
    getParts,
    createPart,
    deactivatePart,
    activatePart,
} from "../../lib/api/partsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js";

// Simulated auth role check (replace with your actual auth context/store)
const useAuth = () => {
    return { user: { role: "admin" } }; // change "admin" to "user" to test non-admin view
};

export function PartsInventory() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [parts, setParts] = useState([]);
    const [meta, setMeta] = useState({ totalParts: 0, activeParts: 0, inactiveParts: 0 });
    const [suppliers, setSuppliers] = useState([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        partName: "",
        partNumber: "",
        price: 0,
        description: "",
        supplier: "",
    });

    const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
    const [showInactive, setShowInactive] = useState(true); // fetch inactive for admin

    useEffect(() => {
        fetchParts();
        fetchSuppliers();
    }, [showInactive]);

    const fetchParts = async () => {
        try {
            const res = await getParts({ includeInactive: showInactive });
            setParts(res.parts || []);
            setMeta(res.meta || { totalParts: 0, activeParts: 0, inactiveParts: 0 });
        } catch (error) {
            console.error("Error fetching parts:", error);
            setParts([]);
            setMeta({ totalParts: 0, activeParts: 0, inactiveParts: 0 });
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await getSuppliers();
            setSuppliers(res || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            setSuppliers([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddPart = async () => {
        if (!isAdmin) return;

        try {
            if (!formData.supplier) {
                alert("Please select a supplier");
                return;
            }

            const payload = {
                partName: formData.partName,
                partNumber: formData.partNumber || null,
                price: Number(formData.price),
                description: formData.description,
                supplier: formData.supplier,
            };

            await createPart(payload);
            setIsAddDialogOpen(false);
            setFormData({ partName: "", partNumber: "", price: 0, description: "", supplier: "" });
            fetchParts();
        } catch (error) {
            console.error("Error adding part:", error.response?.data || error.message);
        }
    };

    const handleDeactivate = async (id) => {
        if (!isAdmin) return;
        try {
            await deactivatePart(id);
            fetchParts();
        } catch (err) {
            console.error("Failed to deactivate:", err);
        }
    };

    const handleActivate = async (id) => {
        if (!isAdmin) return;
        try {
            await activatePart(id);
            fetchParts();
        } catch (err) {
            console.error("Failed to activate:", err);
        }
    };

    // Filtered parts based on status filter
    const filteredParts = parts.filter((p) => {
        if (statusFilter === "active") return p.isActive;
        if (statusFilter === "inactive") return !p.isActive;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header & Add Part Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Parts Inventory Management</h2>

                {isAdmin && (
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="mr-2 h-4 w-4" /> Add Part
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Part</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {["partName", "partNumber", "price", "description"].map((field) => (
                                    <div key={field} className="space-y-2">
                                        <Label htmlFor={field}>
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </Label>
                                        <Input
                                            name={field}
                                            id={field}
                                            type={field === "price" ? "number" : "text"}
                                            value={formData[field]}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                ))}

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <select
                                        id="supplier"
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                        className="w-full border rounded px-2 py-1"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                    onClick={() => setIsAddDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleAddPart}
                                >
                                    Add Part
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Admin toggle for inactive parts */}
            {isAdmin && (
                <div className="flex items-center mb-4 space-x-4">

                    <label htmlFor="showInactive" className="text-sm text-gray-700">
                        Include inactive parts
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Parts</p>
                            <p className="text-2xl font-bold">{meta.totalParts}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-green-600">{meta.activeParts}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50">
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inactive</p>
                            <p className="text-2xl font-bold text-red-600">{meta.inactiveParts}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50">
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Parts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Package className="mr-2 h-5 w-5" /> Parts Inventory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Part Name</TableHead>
                                <TableHead>Part Number</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredParts.map((part) => (
                                <TableRow key={part._id}>
                                    <TableCell>{part.partName}</TableCell>
                                    <TableCell>{part.partNumber || "-"}</TableCell>
                                    <TableCell>
                                        {typeof part.price === "number" ? `$${part.price.toFixed(2)}` : "—"}
                                    </TableCell>
                                    <TableCell>{part.supplier?.name || "Unknown"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={part.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                        >
                                            {part.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {isAdmin &&
                                            (part.isActive ? (
                                                <Button
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                    size="sm"
                                                    onClick={() => handleDeactivate(part._id)}
                                                >
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                    size="sm"
                                                    onClick={() => handleActivate(part._id)}
                                                >
                                                    Activate
                                                </Button>
                                            ))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
