import React, { useMemo } from "react";

function Chip({ label, value }) {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border">
            <span className="opacity-70">{label}:</span>
            <span className="font-medium">{value}</span>
        </span>
    );
}

/**
 * Props:
 * - params: { search, fromDate, toDate, status, services, sortBy, sortDir, perPage, page }
 * - serviceMap: object of { [serviceId]: serviceName } to translate services CSV
 */
export default function ParamsSummary({ params, serviceMap = {} }) {
    const {
        search,
        fromDate,
        toDate,
        status,
        services,
        sortBy,
        sortDir,
        perPage,
        page,
    } = params || {};

    const servicesDisplay = useMemo(() => {
        if (!services) return null;
        const ids = String(services).split(",").map(s => s.trim()).filter(Boolean);
        const names = ids.map(id => serviceMap[id] || id);
        return names.join(", ");
    }, [services, serviceMap]);

    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : null);
    const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

    return (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            <Chip label="Search" value={search} />
            <Chip label="From" value={fmtDate(fromDate)} />
            <Chip label="To" value={fmtDate(toDate)} />
            <Chip label="Status" value={cap(status)} />
            <Chip label="Services" value={servicesDisplay} />
            <Chip label="Sort By" value={sortBy} />
            <Chip label="Order" value={sortDir?.toUpperCase()} />
            <Chip label="Per Page" value={perPage} />
            <Chip label="Page" value={page} />
        </div>
    );
}
