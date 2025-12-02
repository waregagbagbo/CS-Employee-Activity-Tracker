import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="bg-indigo-600 text-white w-64 min-h-screen p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Employee Tracker</h2>

      <nav className="flex flex-col space-y-2">
        <Link
          to="/dashboard"
          className="px-3 py-2 rounded hover:bg-indigo-700 transition"
        >
          Dashboard
        </Link>
        <Link
          to="/reports"
          className="px-3 py-2 rounded hover:bg-indigo-700 transition"
        >
          Reports
        </Link>
        <Link
          to="/logout"
          className="px-3 py-2 rounded bg-red-500 hover:bg-red-600 transition mt-auto"
        >
          Logout
        </Link>
      </nav>
    </div>
  );
}
