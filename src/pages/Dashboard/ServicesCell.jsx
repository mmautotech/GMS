import React, { useState, useRef, useEffect } from "react";

export default function ServicesCell({ services = [], remarks }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const names = Array.isArray(services) ? services : [];
    const first = names[0] || (remarks || "—");
    const rest = names.slice(1);

    // click-outside to close
    useEffect(() => {
        const onDocClick = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    return (
        <div className="relative w-full whitespace-nowrap">
            <span>{first}</span>
            {rest.length > 0 && (
                <>
                    <button
                        type="button"
                        className="ml-1 text-blue-600 hover:underline"
                        onClick={() => setOpen((v) => !v)}
                        title={rest.join(", ")}
                    >
                        …more
                    </button>

                    {open && (
                        <div
                            ref={ref}
                            className="absolute z-20 mt-1 left-0 min-w-[240px] max-w-[360px] rounded border bg-white shadow p-2 text-sm"
                        >
                            <div className="mb-1 font-semibold text-gray-700">Other services</div>
                            <ul className="list-disc pl-5 space-y-1 text-gray-800">
                                {rest.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
