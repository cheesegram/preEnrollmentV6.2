import React, { useEffect, useRef, useState } from "react";

function FilterDropdown({
    label,
    options,
    activeValue,
    setActiveValue,
    suffix = "",
    activeBgClass = "bg-[#2E522A]",
    activeTextClass = "text-white"
}) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isAll = activeValue === 'All' || activeValue === 'all' || activeValue?.startsWith('All ');
    const isActive = !isAll;

    return (
        <div ref={dropdownRef} className="relative w-40 text-sm font-sans">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`flex items-center justify-between w-full h-11 px-4 border rounded-lg cursor-pointer text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-normal ${isActive
                    ? 'border-gray-800 text-gray-900 bg-gray-50 shadow-sm'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
            >
                <span className="truncate">
                    {isAll ? activeValue : `${activeValue} ${suffix}`}
                </span>
                <i className={`fa-solid fa-angle-down transition-transform duration-300 ${open ? 'rotate-180' : ''} ${isActive ? 'text-gray-900' : 'text-gray-400'}`}></i>
            </button>

            {open && (
                <ul className="absolute top-full left-0 w-full py-1.5 mt-2 bg-white rounded-lg shadow-xl z-[100] border border-gray-100 overflow-hidden">
                    {options.map((option) => {
                        const isOptionAll = option === 'All' || option === 'all' || option?.startsWith('All ');
                        const displayText = isOptionAll || !suffix ? option : `${option} ${suffix}`;
                        
                        return (
                            <li
                                key={option}
                                className={`px-4 py-2.5 cursor-pointer transition-colors ${activeValue === option
                                    ? `${activeBgClass} ${activeTextClass}`
                                    : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                onClick={() => {
                                    setActiveValue(option);
                                    setOpen(false);
                                }}
                            >
                                {displayText}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default FilterDropdown;