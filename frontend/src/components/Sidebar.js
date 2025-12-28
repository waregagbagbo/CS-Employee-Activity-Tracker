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
} from "react-icons/fa";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const modules = [
    { name: "DASHBOARD", route: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "EMPLOYEES", route: "/employees", icon: <FaUsers /> },
    {name: "SHIFTS", route: "/shifts", icon: <FaTachometerAlt /> },
    { name: "REPORTS", route: "/reports", icon: <FaFileAlt /> },
    { name: "DEPARTMENTS", route: "/departments", icon: <FaBuilding /> },
    { name: "ATTENDANCE", route: "/attendance", icon: <FaCalendarCheck /> },
  ];

  const isActive = (route) => location.pathname === route;

  return (
    <div
      className={`${
        open ? "w-72" : "w-24"
      } bg-black text-white transition-all duration-500 min-h-screen flex flex-col relative z-50 shadow-[10px_0_30px_rgba(0,0,0,0.1)]`}
    >
      {/* Brand Header */}
      <div className="p-8 flex items-center mb-4">
        <div className={`flex items-center space-x-4 ${!open && "mx-auto"}`}>
          <div className="w-10 h-10 bg-[#FFCC00] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.3)]">
            <div className="w-5 h-5 bg-black rounded-sm"></div>
          </div>
          {open && (
            <div className="leading-none">
              <h2 className="text-xl font-black tracking-tighter italic italic uppercase">
                ONAFRIQ
              </h2>
              <p className="text-[10px] font-bold text-[#FFCC00] tracking-[0.3em] uppercase">
                Ops Center
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button - Sleek and Minimal */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-10 w-7 h-7 bg-[#FFCC00] text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all border-4 border-black"
        >
          {open ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 space-y-2">
        {modules.map((mod, idx) => {
          const active = isActive(mod.route);
          return (
            <Link
              key={idx}
              to={mod.route}
              className={`
                flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-300 group
                ${active 
                  ? "bg-[#FFCC00] text-black shadow-[0_10px_20px_rgba(255,204,0,0.2)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }
                ${!open && "justify-center px-0"}
              `}
            >
              <span className={`text-xl ${active ? "text-black" : "group-hover:text-[#FFCC00] transition-colors"}`}>
                {mod.icon}
              </span>

              {open && (
                <span className={`text-xs font-black tracking-widest ${active ? "text-black" : ""}`}>
                  {mod.name}
                </span>
              )}

              {/* Minimalist Active Indicator */}
              {active && open && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout Section */}
      <div className="p-4 mt-auto space-y-4">
        {open && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#FFCC00] rounded-full flex items-center justify-center text-black font-black text-sm">
                {localStorage.getItem("username")?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate uppercase tracking-tight">
                  {localStorage.getItem("username") || "Admin"}
                </p>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/logout"
          className={`
            flex items-center space-x-4 px-4 py-4 rounded-xl
            bg-white/5 hover:bg-rose-600/20 hover:text-rose-500 text-gray-400 transition-all duration-300
            ${!open && "justify-center"}
          `}
        >
          <FaSignOutAlt className="text-xl" />
          {open && <span className="text-xs font-black tracking-widest uppercase">Logout</span>}
        </Link>
      </div>

      {/* Version Tag */}
      {open && (
        <div className="py-6 text-center">
          <p className="text-[10px] font-black text-gray-700 tracking-[0.5em] uppercase italic">
            Onafriq Core Support
          </p>
        </div>
      )}
    </div>
  );
}