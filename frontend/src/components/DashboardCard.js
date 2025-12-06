import React from "react";

export default function DashboardCard({
  title,
  value,
  icon,
  onClick,
  color = "bg-indigo-500",
  trend,
  trendUp = true
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white shadow-md rounded-xl p-6 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100"
    >
      {/* Top Section - Icon and Trend */}
      <div className="flex justify-between items-start mb-4">
        {/* Icon with colored background */}
        <div className={`${color} text-white p-3 rounded-lg shadow-md`}>
          <div className="text-2xl">{icon}</div>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-semibold px-2 py-1 rounded-full ${
            trendUp 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {trendUp ? (
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              )}
            </svg>
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Bottom Section - Title and Value */}
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>

      {/* Hover Effect Indicator */}
      <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Details</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// Alternative Card Style - Gradient Background
export function GradientDashboardCard({
  title,
  value,
  icon,
  onClick,
  gradientFrom = "from-indigo-500",
  gradientTo = "to-purple-600"
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          <div className="text-2xl">{icon}</div>
        </div>
      </div>

      <div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// Compact Card Style
export function CompactDashboardCard({
  title,
  value,
  icon,
  onClick,
  color = "bg-indigo-500"
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100 flex items-center space-x-4"
    >
      <div className={`${color} text-white p-3 rounded-lg flex-shrink-0`}>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-xs font-medium uppercase truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}