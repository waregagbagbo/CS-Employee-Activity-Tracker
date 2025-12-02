import React from "react";

export default function DashboardCard({ title, value, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 flex items-center space-x-4">
      {icon && <div className="text-indigo-600 text-3xl">{icon}</div>}
      <div>
        <p className="text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
