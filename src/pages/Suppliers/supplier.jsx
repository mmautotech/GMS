// src/pages/Suppliers/index.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Users, Plus, Edit, Trash2, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, restoreSupplier } from "../../lib/api/suppliersApi";
import { toast } from "react-toastify";

export default function Suppliers() {
    const [suppliersList, setSuppliersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [filter, setFilter] = useState("all"); // all | active | inactive
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        email: "",
        address: "",
        bankAccount: "",
    });

    // Fetch suppliers
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await getSuppliers({ includeInactive: true });
            const suppliersArray = Array.isArray(res) ? res : res?.suppliers || res?.data || [];
            setSuppliersList(suppliersArray);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load suppliers");
            setSuppliersList([]);
        } finally {
            setLoading(false);
        }
    };

    const getActiveSuppliers = () => suppliersList.filter((s) => s.isActive).length;
    const getInactiveSuppliers = () => suppliersList.filter((s) => !s.isActive).length;

    const openDialog = (supplier = null) => {
        setEditingSupplier(supplier);
        setFormData(
            supplier || {
                name: "",
                contact: "",
                email: "",
                address: "",
                bankAccount: "",
            }
        );
        setIsDialogOpen(true);
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveSupplier = async () => {
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier._id, formData);
                toast.success("Supplier updated");
            } else {
                await createSupplier(formData);
                toast.success("Supplier created");
            }
            setIsDialogOpen(false);
            setEditingSupplier(null);
            setFormData({ name: "", contact: "", email: "", address: "", bankAccount: "" });
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save supplier");
        }
    };

    const handleDeleteSupplier = async (_id) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await deleteSupplier(_id);
            toast.success("Supplier deleted");
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete supplier");
        }
    };

    const handleRestoreSupplier = async (_id) => {
        try {
            await restoreSupplier(_id);
            toast.success("Supplier restored");
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            toast.error("Failed to restore supplier");
        }
    };

    const filteredSuppliers = suppliersList
        .filter((s) => {
            if (filter === "active") return s.isActive;
            if (filter === "inactive") return !s.isActive;
            return true;
        })
        .filter((s) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                s.name?.toLowerCase().includes(term) ||
                s.contact?.toLowerCase().includes(term) ||
                s.email?.toLowerCase().includes(term)
            );
        });

    if (loading) return <p>Loading suppliers...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Supplier Management</h2>
                <Button className="bg-primary hover:bg-primary-hover" onClick={() => openDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Suppliers</p>
                            <p className="text-2xl font-bold">{suppliersList.length}</p>
                        </div>
                        <Users className="h-6 w-6 text-blue-600" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Suppliers</p>
                            <p className="text-2xl font-bold text-green-600">{getActiveSuppliers()}</p>
                        </div>
                        <Users className="h-6 w-6 text-green-600" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inactive Suppliers</p>
                            <p className="text-2xl font-bold text-red-600">{getInactiveSuppliers()}</p>
                        </div>
                        <Users className="h-6 w-6 text-red-600" />
                    </CardContent>
                </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                    All
                </Button>
                <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>
                    Active
                </Button>
                <Button variant={filter === "inactive" ? "default" : "outline"} onClick={() => setFilter("inactive")}>
                    Inactive
                </Button>
            </div>

            {/* Search Input */}
            <div className="my-4">
                <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Supplier Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" /> Supplier Directory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSuppliers.length === 0 ? (
                        <p className="text-gray-500">No suppliers found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Bank Account</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.isArray(filteredSuppliers) &&
                                    filteredSuppliers.map((supplier) => (
                                        <TableRow key={supplier._id} className={!supplier.isActive ? "opacity-60" : ""}>
                                            <TableCell>{supplier.name}</TableCell>
                                            <TableCell>{supplier.contact}</TableCell>
                                            <TableCell>{supplier.email}</TableCell>
                                            <TableCell>{supplier.address}</TableCell>
                                            <TableCell>{supplier.bankAccount || "-"}</TableCell>
                                            <TableCell>
                                                <Badge className={supplier.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                    {supplier.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => openDialog(supplier)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {supplier.isActive ? (
                                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteSupplier(supplier._id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleRestoreSupplier(supplier._id)}>
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Supplier Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {[
                            { id: "name", label: "Supplier Name" },
                            { id: "contact", label: "Phone Number" },
                            { id: "email", label: "Email Address", type: "email" },
                            { id: "address", label: "Address", colSpan: 2 },
                            { id: "bankAccount", label: "Bank Account Details", colSpan: 2 },
                        ].map((field) => (
                            <div key={field.id} className={`space-y-2 ${field.colSpan ? "col-span-2" : ""}`}>
                                <Label htmlFor={field.id}>{field.label}</Label>
                                <Input id={field.id} type={field.type || "text"} value={formData[field.id]} onChange={handleChange} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-primary hover:bg-primary-hover" onClick={handleSaveSupplier}>
                            {editingSupplier ? "Update Supplier" : "Add Supplier"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
