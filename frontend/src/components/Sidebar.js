import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaFileAlt,
  FaBuilding,
  FaCalendarCheck,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars
} from "react-icons/fa";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const modules = [
    { name: "Dashboard", route: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Employees", route: "/employees", icon: <FaUsers /> },
    { name: "Reports", route: "/reports", icon: <FaFileAlt /> },
    { name: "Departments", route: "/departments", icon: <FaBuilding /> },
    { name: "Attendance", route: "/attendance", icon: <FaCalendarCheck /> },
  ];

  const isActive = (route) => location.pathname === route;

  return (
    <div
      className={`${
        open ? "w-64" : "w-20"
      } bg-gradient-to-b from-indigo-700 to-indigo-900 text-white transition-all duration-300 min-h-screen flex flex-col shadow-2xl relative`}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-indigo-600">
        <div className={`flex items-center space-x-3 ${!open && "justify-center"}`}>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <FaBars className="text-indigo-600 text-xl" />
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-bold">Employee</h2>
              <p className="text-xs text-indigo-200">Tracker</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
        >
          {open ? <FaChevronLeft className="text-xs" /> : <FaChevronRight className="text-xs" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-1 px-3 py-6">
        {modules.map((mod, idx) => (
          <Link
            key={idx}
            to={mod.route}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive(mod.route) 
                ? "bg-white text-indigo-600 shadow-lg font-semibold" 
                : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
              }
              ${!open && "justify-center"}
            `}
            title={!open ? mod.name : ""}
          >
            <span className="text-xl">{mod.icon}</span>
            {open && <span className="text-sm">{mod.name}</span>}

            {/* Active Indicator */}
            {isActive(mod.route) && open && (
              <span className="ml-auto w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile Section (Optional) */}
      {open && (
        <div className="px-4 py-4 border-t border-indigo-600">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
              {localStorage.getItem("username")?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {localStorage.getItem("username") || "User"}
              </p>
              <p className="text-xs text-indigo-300 truncate">
                {localStorage.getItem("email") || "user@example.com"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-3">
        <Link
          to="/logout"
          className={`
            flex items-center space-x-3 px-4 py-3 rounded-lg
            bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg
            ${!open && "justify-center"}
          `}
          title={!open ? "Logout" : ""}
        >
          <FaSignOutAlt className="text-xl" />
          {open && <span className="text-sm font-semibold">Logout</span>}
        </Link>
      </div>

      {/* Footer Version */}
      {open && (
        <div className="px-4 py-3 text-center border-t border-indigo-600">
          <p className="text-xs text-indigo-300">v1.0.0</p>
        </div>
      )}
    </div>
  );
}