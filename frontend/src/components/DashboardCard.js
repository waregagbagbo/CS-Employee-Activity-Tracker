import React from "react";

export default function DashboardCard({ title, value, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transform transition-all duration-300"
    >
      <div className="text-indigo-600 text-4xl">{icon}</div>
      <div>
        <p className="text-gray-400 uppercase text-sm">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
