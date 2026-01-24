import React from "react";
import useShiftTimer from "../hooks/useShiftTimer";

export default function LiveShiftTimer({ shift }) {
  const {
    hours,
    minutes,
    seconds,
    remainingSeconds,
    isComplete,
  } = useShiftTimer(shift.shift_start_time, shift.shift_status);

  if (shift.shift_status !== "In Progress") {
    return (
      <span className="text-gray-500 italic">
        Shift not active
      </span>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gray-900 text-white shadow">
      <p className="text-sm uppercase tracking-wide text-gray-400">
        Live Attendance
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {hours}h {minutes}m {seconds}s
      </h2>

      <p className="mt-2 text-sm">
        {isComplete ? (
          <span className="text-green-400 font-semibold">
            Minimum hours reached
          </span>
        ) : (
          <span className="text-yellow-400">
            Remaining: {Math.floor(remainingSeconds / 3600)}h{" "}
            {Math.floor((remainingSeconds % 3600) / 60)}m
          </span>
        )}
      </p>
    </div>
  );
}
