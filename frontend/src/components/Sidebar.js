import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const modules = [
    { name: "Dashboard", route: "/dashboard" },
    { name: "Employees", route: "/employees" },
    { name: "Reports", route: "/reports" },
    { name: "Departments", route: "/departments" },
    { name: "Attendance", route: "/attendance" },
  ];

  return (
    <div className={`bg-indigo-600 text-white ${open ? "w-64" : "w-20"} transition-all duration-300 min-h-screen flex flex-col`}>
      <div className="p-6 flex justify-between items-center">
        <h2 className={`${open ? "text-xl font-bold" : "text-sm"} transition-all duration-300`}>Employee Tracker</h2>
        <button onClick={() => setOpen(!open)} className="text-white text-xl focus:outline-none">
          {open ? "«" : "»"}
        </button>
      </div>

      <nav className="flex-1 flex flex-col space-y-2 px-2">
        {modules.map((mod, idx) => (
          <Link
            key={idx}
            to={mod.route}
            className="px-3 py-2 rounded hover:bg-indigo-700 transition"
          >
            {mod.name}
          </Link>
        ))}
      </nav>

      <Link
        to="/logout"
        className="px-3 py-2 rounded bg-red-500 hover:bg-red-600 m-6 text-center"
      >
        Logout
      </Link>
    </div>
  );
}
