import { useEffect } from "react";

function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;

        const esc = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">

            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#2E522A]/50"
                        aria-label="Close modal"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;