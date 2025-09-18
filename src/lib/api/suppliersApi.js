import axiosInstance from './axiosInstance';


// ✅ Get all suppliers (with optional filters/pagination)
export async function getSuppliers(params = {}) {
    const { data } = await axiosInstance.get("/suppliers", { params });
    return data;
}

// ✅ Get a single supplier by ID
export async function getSupplierById(id) {
    if (!id) throw new Error("❌ getSupplierById: ID is required");
    const { data } = await axiosInstance.get(`/suppliers/${id}`);
    return data;
}

// ✅ Create a new supplier
export async function createSupplier(payload) {
    if (!payload) throw new Error("❌ createSupplier: payload is required");
    const { data } = await axiosInstance.post("/suppliers", payload);
    return data;
}

// ✅ Update an existing supplier
export async function updateSupplier(id, payload) {
    if (!id) throw new Error("❌ updateSupplier: ID is required");
    const { data } = await axiosInstance.put(`/suppliers/${id}`, payload);
    return data;
}

// ✅ Soft delete a supplier
export async function deleteSupplier(id) {
    if (!id) throw new Error("❌ deleteSupplier: ID is required");
    const { data } = await axiosInstance.delete(`/suppliers/${id}`);
    return data;
}

// ✅ Restore a soft-deleted supplier
export async function restoreSupplier(id) {
    if (!id) throw new Error("❌ restoreSupplier: ID is required");
    const { data } = await axiosInstance.patch(`/suppliers/${id}/restore`);
    return data;
}
