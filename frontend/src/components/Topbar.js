import React from "react";

export default function Topbar({ title, user }) {
  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600 font-medium">{user || "Welcome, User"}</span>
        {/* Optional notification icon */}
        <div className="relative">
          <div className="w-3 h-3 bg-red-500 rounded-full absolute top-0 right-0 animate-pulse"></div>
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405M19 13V9a7 7 0 10-14 0v4l-2 2v1h18v-1l-2-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
