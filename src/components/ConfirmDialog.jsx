import React from "react";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-sm">
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
