import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Users, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import * as supplierAPI from "../../lib/api/suppliersApi";

export function Suppliers() {
    const [suppliersList, setSuppliersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
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
            const data = await supplierAPI.getSuppliers();
            setSuppliersList(data);
        } catch (err) {
            console.error(err);
            setSuppliersList([]);
        } finally {
            setLoading(false);
        }
    };

    // Open dialog for adding or editing
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

    // Handle form input changes
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Save supplier (create or update)
    const handleSaveSupplier = async () => {
        try {
            if (editingSupplier) {
                const updated = await supplierAPI.updateSupplier(editingSupplier._id, formData);
                setSuppliersList(
                    suppliersList.map((s) => (s._id === updated._id ? updated : s))
                );
            } else {
                const added = await supplierAPI.createSupplier(formData);
                setSuppliersList([...suppliersList, added]);
            }
            setIsDialogOpen(false);
            // Reset form
            setFormData({
                name: "",
                contact: "",
                email: "",
                address: "",
                bankAccount: "",
            });
            setEditingSupplier(null);
        } catch (err) {
            console.error(err);
        }
    };

    // Delete supplier
    const handleDeleteSupplier = async (_id) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await supplierAPI.deleteSupplier(_id);
            setSuppliersList(suppliersList.filter((s) => s._id !== _id));
        } catch (err) {
            console.error(err);
        }
    };

    const getTotalOutstanding = () =>
        suppliersList
            .filter((s) => s.isActive)
            .reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

    const getActiveSuppliers = () => suppliersList.filter((s) => s.isActive).length;

    if (loading) return <p>Loading suppliers...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Supplier Management</h2>
                <Button
                    className="bg-primary hover:bg-primary-hover"
                    onClick={() => openDialog()}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Suppliers</p>
                                <p className="text-2xl font-bold">{suppliersList.length}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Suppliers</p>
                                <p className="text-2xl font-bold">{getActiveSuppliers()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Outstanding Balance</p>
                                <p className="text-2xl font-bold">
                                    ${getTotalOutstanding().toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-50">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Supplier Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" /> Supplier Directory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {suppliersList.length === 0 ? (
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
                                    <TableHead>Outstanding</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliersList.map((supplier) => (
                                    <TableRow
                                        key={supplier._id}
                                        className={!supplier.isActive ? "opacity-60" : ""}
                                    >
                                        <TableCell>{supplier.name}</TableCell>
                                        <TableCell>{supplier.contact}</TableCell>
                                        <TableCell>{supplier.email}</TableCell>
                                        <TableCell>{supplier.address}</TableCell>
                                        <TableCell>{supplier.bankAccount || "-"}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`font-medium ${supplier.outstandingBalance > 0
                                                    ? "text-red-600"
                                                    : "text-green-600"
                                                    }`}
                                            >
                                                ${supplier.outstandingBalance?.toFixed(2) || "0.00"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    supplier.isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }
                                            >
                                                {supplier.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDialog(supplier)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteSupplier(supplier._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                        <DialogTitle>
                            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {[
                            { id: "name", label: "Supplier Name" },
                            { id: "contact", label: "Phone Number" },
                            { id: "email", label: "Email Address", type: "email" },
                            { id: "address", label: "Address", colSpan: 2 },
                            { id: "bankAccount", label: "Bank Account Details", colSpan: 2 },
                        ].map((field) => (
                            <div
                                key={field.id}
                                className={`space-y-2 ${field.colSpan ? "col-span-2" : ""}`}
                            >
                                <Label htmlFor={field.id}>{field.label}</Label>
                                <Input
                                    id={field.id}
                                    type={field.type || "text"}
                                    value={formData[field.id]}
                                    onChange={handleChange}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary-hover"
                            onClick={handleSaveSupplier}
                        >
                            {editingSupplier ? "Update Supplier" : "Add Supplier"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
