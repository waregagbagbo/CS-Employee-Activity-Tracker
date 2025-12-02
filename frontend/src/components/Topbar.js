import React from "react";

export default function Topbar({ title }) {
  return (
    <div className="bg-gray-100 p-4 shadow flex justify-between items-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <div>
        <span className="text-gray-700 font-medium">Welcome, User</span>
      </div>
    </div>
  );
}
