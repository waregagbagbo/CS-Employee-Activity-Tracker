// src/components/Loader.js
import React from "react";

export default function Loader({ message = "Loading...", fullPage = false, size = "md" }) {
  // Size configurations
  const sizes = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-4",
    lg: "h-16 w-16 border-4",
    xl: "h-20 w-20 border-4"
  };

  // Full page loader with overlay
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          {/* Double Ring Spinner */}
          <div className="relative inline-block mb-6">
            <div className={`${sizes[size]} rounded-full border-indigo-200 absolute`}></div>
            <div className={`${sizes[size]} rounded-full border-indigo-600 border-t-transparent animate-spin`}></div>
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{message}</h3>
          <p className="text-sm text-gray-500">Please wait a moment</p>

          {/* Animated Dots */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Default inline loader
  return (
    <div className="flex flex-col justify-center items-center p-10">
      {/* Double Ring Effect */}
      <div className="relative inline-block">
        <div className={`${sizes[size]} rounded-full border-indigo-200`}></div>
        <div className={`${sizes[size]} rounded-full border-indigo-600 border-t-transparent animate-spin absolute top-0`}></div>
      </div>

      {/* Optional Message */}
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
}

// Additional specialized loaders you can import
export function ButtonLoader({ color = "white" }) {
  const colors = {
    white: "border-white/30 border-t-white",
    indigo: "border-indigo-200 border-t-indigo-600",
    gray: "border-gray-300 border-t-gray-600"
  };

  return (
    <div className={`h-5 w-5 rounded-full border-2 ${colors[color]} animate-spin`}></div>
  );
}

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function TableLoader({ rows = 5 }) {
  return (
    <div className="animate-pulse p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}