import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Package, Plus, AlertTriangle, TrendingUp } from "lucide-react";
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

import { getParts, createPart, restockPart } from "../../lib/api/partsApi.js";
import { getSuppliers } from "../../lib/api/suppliersApi.js"; // make sure this API exists

export function PartsInventory() {
    const [parts, setParts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        supplier: "",
        unitPrice: 0,
        minStock: 0,
        maxStock: 0,
        currentStock: 0,
    });

    useEffect(() => {
        fetchParts();
        fetchSuppliers();
    }, []);

    const fetchParts = async () => {
        try {
            const data = await getParts();
            setParts(data);
        } catch (error) {
            console.error("Error fetching parts:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const getStockStatus = (currentStock, minStock) => {
        return currentStock <= minStock
            ? { status: "low", color: "bg-red-100 text-red-800" }
            : { status: "good", color: "bg-green-100 text-green-800" };
    };

    const getLowStockParts = () =>
        parts.filter((part) => part.currentStock <= part.minStock);

    const getTotalInventoryValue = () =>
        parts.reduce((total, part) => total + part.currentStock * part.unitPrice, 0);

    const handleRestock = (part) => {
        setSelectedPart(part);
        setIsRestockDialogOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddPart = async () => {
        try {
            if (!formData.supplier) {
                alert("Please select a supplier");
                return;
            }

            const payload = {
                ...formData,
                unitPrice: Number(formData.unitPrice),
                minStock: Number(formData.minStock),
                maxStock: Number(formData.maxStock),
                currentStock: Number(formData.currentStock),
            };

            await createPart(payload);
            setIsAddDialogOpen(false);
            setFormData({
                name: "",
                category: "",
                supplier: "",
                unitPrice: 0,
                minStock: 0,
                maxStock: 0,
                currentStock: 0,
            });
            fetchParts();
        } catch (error) {
            console.error("Error adding part:", error.response?.data || error.message);
        }
    };

    const handleRestockSubmit = async () => {
        try {
            const quantityInput = document.getElementById("quantity").value;
            const quantity = parseInt(quantityInput);
            if (!quantity || quantity <= 0) return;

            await restockPart(selectedPart._id, quantity);
            setIsRestockDialogOpen(false);
            fetchParts();
        } catch (error) {
            console.error("Error restocking part:", error.response?.data || error.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Part Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Parts Inventory Management</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Add Part
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Part</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {["name", "category", "unitPrice", "minStock", "maxStock", "currentStock"].map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                                    <Input
                                        name={field}
                                        id={field}
                                        type={["unitPrice", "minStock", "maxStock", "currentStock"].includes(field) ? "number" : "text"}
                                        value={formData[field]}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            ))}
                            {/* Supplier Dropdown */}
                            <div className="space-y-2">
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
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary-hover" onClick={handleAddPart}>Add Part</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Parts</p>
                            <p className="text-2xl font-bold">{parts.length}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Low Stock Items</p>
                            <p className="text-2xl font-bold text-red-600">{getLowStockParts().length}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inventory Value</p>
                            <p className="text-2xl font-bold">${getTotalInventoryValue().toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50">
                            <TrendingUp className="h-6 w-6 text-green-600" />
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
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Min/Max Stock</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parts.map((part) => {
                                const stockStatus = getStockStatus(part.currentStock, part.minStock);
                                return (
                                    <TableRow key={part.name + part.category}>
                                        <TableCell>{part.name}</TableCell>
                                        <TableCell>{part.category}</TableCell>
                                        <TableCell className={part.currentStock <= part.minStock ? 'text-red-600 font-medium' : ''}>{part.currentStock}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{part.minStock} / {part.maxStock}</TableCell>
                                        <TableCell>${part.unitPrice.toFixed(2)}</TableCell>
                                        <TableCell>{part.supplier?.name || part.supplier}</TableCell>
                                        <TableCell>
                                            <Badge className={stockStatus.color}>{stockStatus.status === "low" ? "Low Stock" : "Good"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestock(part)}
                                                className={part.currentStock <= part.minStock ? "border-red-300 text-red-600" : ""}
                                            >
                                                Restock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Restock Dialog */}
            <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restock Part</DialogTitle>
                    </DialogHeader>
                    {selectedPart && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium">{selectedPart.name}</h4>
                                <p className="text-sm text-gray-600">Current Stock: {selectedPart.currentStock}</p>
                                <p className="text-sm text-gray-600">Recommended: {selectedPart.maxStock - selectedPart.currentStock} units</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity to Add</Label>
                                <Input id="quantity" type="number" placeholder="Enter quantity" />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>Cancel</Button>
                                <Button className="bg-primary hover:bg-primary-hover" onClick={handleRestockSubmit}>Update Stock</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
