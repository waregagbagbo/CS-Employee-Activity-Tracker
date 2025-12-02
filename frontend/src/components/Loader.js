// src/components/Loader.js
import React from "react";

export default function Loader() {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  );
}
