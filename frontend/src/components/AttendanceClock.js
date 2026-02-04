import React, { useEffect, useState, useCallback } from "react";
import AttendanceService from "../services/attendance";
import { FaClock, FaPlay, FaStop } from "react-icons/fa";

export default function AttendanceClock({ userType }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const isEmployee = userType === "employee_agent";

  // Wrap loadStatus in useCallback so it can be used safely in useEffect
  const loadStatus = useCallback(async () => {
    try {
      const data = await AttendanceService.getStatus();
      setStatus(data);
      if (data?.seconds_worked_today) {
        setTimer(data.seconds_worked_today);
      }
    } catch (err) {
      console.error("Attendance status error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    if (isEmployee) loadStatus();
  }, [isEmployee, loadStatus]);

  // Handle Tab Focus / Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Re-fetch from server when user returns to the tab
      if (document.visibilityState === "visible" && isEmployee) {
        loadStatus();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isEmployee, loadStatus]);

  // Live Timer Logic
  useEffect(() => {
    if (!status?.is_clocked_in) return;

    // Calculate start point to prevent drift
    const startTime = Date.now() - (status.seconds_worked_today * 1000);

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(currentElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.is_clocked_in, status?.seconds_worked_today]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === "in") await AttendanceService.clockIn();
      else await AttendanceService.clockOut();
      await loadStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(":");
  };

  if (!isEmployee) return null;
  if (loading) return <div className="p-6 text-sm text-gray-400">Loading attendance...</div>;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-[#FFCC00]" />
        <h3 className="font-black uppercase tracking-widest text-xs">Live Attendance</h3>
      </div>

      <div className="text-3xl font-black mb-4 tabular-nums">
        {status?.is_clocked_in ? formatTime(timer) : "00:00:00"}
      </div>

      <button
        onClick={() => handleAction(status?.is_clocked_in ? "out" : "in")}
        disabled={actionLoading}
        className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] ${
          status?.is_clocked_in ? "bg-black text-[#FFCC00]" : "bg-[#FFCC00] text-black"
        }`}
      >
        {status?.is_clocked_in ? (
          <><FaStop /> CLOCK OUT</>
        ) : (
          <><FaPlay /> CLOCK IN</>
        )}
      </button>
    </div>
  );
}