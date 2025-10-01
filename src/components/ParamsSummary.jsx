// src/components/ParamsSummary.jsx
import React, { useMemo } from "react";

function Chip({ label, value }) {
    if (
        value == null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    ) {
        return null;
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border">
            <span className="opacity-70">{label}:</span>
            <span className="font-medium">{value}</span>
        </span>
    );
}

/**
 * ParamsSummary — shows currently applied filters in chip format
 *
 * Props:
 * - params: object returned from backend response (res.params)
 * - serviceMap: { [serviceId]: serviceName }   (used in CarIn)
 * - userMap: { [userId]: username }            (used in CarIn + PartsPurchase)
 * - supplierMap: { [supplierId]: name }        (optional for PartsPurchase)
 * - partMap: { [partId]: partName }            (optional for PartsPurchase)
 */
export default function ParamsSummary({
    params,
    serviceMap = {},
    userMap = {},
    supplierMap = {},
    partMap = {},
}) {
    if (!params) return null;

    // CarIn services display
    const servicesDisplay = useMemo(() => {
        if (!params.services) return null;
        const ids = String(params.services)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const names = ids.map((id) => serviceMap[id] || id);
        return names.join(", ");
    }, [params.services, serviceMap]);

    // CarIn user display (field = user)
    const userDisplay = useMemo(() => {
        if (!params.user) return null;
        return userMap[params.user] || params.user;
    }, [params.user, userMap]);

    // PartsPurchase purchaser display (field = purchaser)
    const purchaserDisplay = useMemo(() => {
        if (!params.purchaser) return null;
        return userMap[params.purchaser] || params.purchaser;
    }, [params.purchaser, userMap]);

    // Supplier display (PartsPurchase)
    const supplierDisplay = useMemo(() => {
        if (!params.supplier) return null;
        return supplierMap[params.supplier] || params.supplier;
    }, [params.supplier, supplierMap]);

    // Part display (PartsPurchase)
    const partDisplay = useMemo(() => {
        if (!params.part) return null;
        return partMap[params.part] || params.part;
    }, [params.part, partMap]);

    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : null);

    return (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Common */}
            {params.search && <Chip label="Search" value={params.search} />}
            {params.sortBy && <Chip label="Sort By" value={params.sortBy} />}
            {params.sortDir && (
                <Chip label="Order" value={params.sortDir?.toUpperCase()} />
            )}
            {params.sortOrder && (
                <Chip label="Order" value={params.sortOrder?.toUpperCase()} />
            )}
            {params.perPage && <Chip label="Per Page" value={params.perPage} />}
            {params.limit && <Chip label="Per Page" value={params.limit} />}
            {params.page && <Chip label="Page" value={params.page} />}

            {/* CarIn specific */}
            {params.fromDate && <Chip label="From" value={fmtDate(params.fromDate)} />}
            {params.toDate && <Chip label="To" value={fmtDate(params.toDate)} />}
            {params.status && <Chip label="Status" value={params.status} />}
            {params.services && <Chip label="Services" value={servicesDisplay} />}
            {params.user && <Chip label="User" value={userDisplay} />}

            {/* PartsPurchase specific */}
            {params.startDate && <Chip label="From" value={fmtDate(params.startDate)} />}
            {params.endDate && <Chip label="To" value={fmtDate(params.endDate)} />}
            {params.paymentStatus && (
                <Chip label="Payment Status" value={params.paymentStatus} />
            )}
            {params.vatIncluded != null && params.vatIncluded !== "" && (
                <Chip
                    label="VAT"
                    value={params.vatIncluded === true || params.vatIncluded === "true" ? "Yes" : "No"}
                />
            )}
            {params.purchaser && <Chip label="Purchaser" value={purchaserDisplay} />}
            {params.supplier && <Chip label="Supplier" value={supplierDisplay} />}
            {params.part && <Chip label="Part" value={partDisplay} />}
        </div>
    );
}
