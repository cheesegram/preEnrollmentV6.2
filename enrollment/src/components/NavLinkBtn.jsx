import React from 'react';
import { NavLink } from 'react-router-dom';

function NavLinkBtn() {
    // Shared styling for all links
    const baseClasses = "flex items-center gap-4 px-5 py-3.5 rounded-xl font-medium transition-all duration-200";

    // Styling applied only when the link is active
    const activeClasses = "bg-[#2E522A] text-white shadow-md";

    // Styling applied when the link is inactive
    const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-[#2E522A]";

    return (
        <div className="flex flex-col gap-2 w-full">
            <li>
                <NavLink
                    to="/"
                    className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <i className="fa-solid fa-gauge-high w-5 text-center text-lg"></i>
                    Dashboard
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/students"
                    className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <i className="fa-solid fa-user w-5 text-center text-lg"></i>
                    Student List
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/curriculum"
                    className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <i className="fa-solid fa-clipboard-list w-5 text-center text-lg"></i>
                    Curriculum
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/section"
                    className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                    <i className="fa-solid fa-users-between-lines w-5 text-center text-lg"></i>
                    Section
                </NavLink>
            </li>
        </div>
    );
}

export default NavLinkBtn;