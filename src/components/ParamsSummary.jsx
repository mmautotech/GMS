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
 * - serviceMap: { [serviceId]: serviceName }
 * - userMap: { [userId]: username }
 */
export default function ParamsSummary({ params, serviceMap = {}, userMap = {} }) {
    if (!params) return null;

    const servicesDisplay = useMemo(() => {
        if (!params.services) return null;
        const ids = String(params.services)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const names = ids.map((id) => serviceMap[id] || id);
        return names.join(", ");
    }, [params.services, serviceMap]);

    const userDisplay = useMemo(() => {
        if (!params.user) return null;
        return userMap[params.user] || params.user;
    }, [params.user, userMap]);

    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : null);

    return (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            {params.search && <Chip label="Search" value={params.search} />}
            {params.fromDate && <Chip label="From" value={fmtDate(params.fromDate)} />}
            {params.toDate && <Chip label="To" value={fmtDate(params.toDate)} />}
            {params.status && <Chip label="Status" value={params.status} />}
            {params.services && <Chip label="Services" value={servicesDisplay} />}
            {params.user && <Chip label="User" value={userDisplay} />}
            {params.sortBy && <Chip label="Sort By" value={params.sortBy} />}
            {params.sortDir && (
                <Chip label="Order" value={params.sortDir?.toUpperCase()} />
            )}
            {params.perPage && <Chip label="Per Page" value={params.perPage} />}
            {params.page && <Chip label="Page" value={params.page} />}
        </div>
    );
}
