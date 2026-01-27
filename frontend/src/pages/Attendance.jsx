import React, { useState, useEffect } from "react";
import { FaClock, FaSignOutAlt, FaSignInAlt, FaCircle } from "react-icons/fa";
import { getAttendanceStatus, clockIn, clockOut } from "../services/attendance";

export default function AttendanceWidget() {
  const [status, setStatus] = useState({ is_clocked_in: false, clock_in_time: null });
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(true);

  // Sync with backend on mount
  useEffect(() => {
    const initStatus = async () => {
      try {
        const res = await getAttendanceStatus();
        setStatus(res.data);
      } catch (err) { console.error("Status Sync Error"); }
      finally { setLoading(false); }
    };
    initStatus();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (status.is_clocked_in && status.clock_in_time) {
      interval = setInterval(() => {
        const start = new Date(status.clock_in_time).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);

        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setElapsed("00:00:00");
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [status.is_clocked_in, status.clock_in_time]);

  const handleAction = async () => {
    try {
      if (status.is_clocked_in) {
        await clockOut();
        setStatus({ is_clocked_in: false, clock_in_time: null });
      } else {
        const res = await clockIn();
        setStatus({ is_clocked_in: true, clock_in_time: res.data.clock_in_time });
      }
    } catch (err) {
      alert("ACTION REJECTED: TERMINAL SYNC FAILURE.");
    }
  };

  if (loading) return <div className="animate-pulse bg-white/5 h-32 rounded-[2rem]"></div>;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center">
      <div className="flex justify-between w-full mb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
          <FaCircle className={status.is_clocked_in ? "text-green-500 animate-pulse" : "text-gray-300"} size={8} />
          {status.is_clocked_in ? "Duty Active" : "Duty Inactive"}
        </span>
        <FaClock className={status.is_clocked_in ? "text-[#FFCC00]" : "text-gray-200"} />
      </div>

      <h2 className={`text-5xl font-black italic tracking-tighter mb-2 ${status.is_clocked_in ? "text-black" : "text-gray-300"}`}>
        {elapsed}
      </h2>

      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-8">
        {status.is_clocked_in ? `Started: ${new Date(status.clock_in_time).toLocaleTimeString()}` : "Ready for Deployment"}
      </p>

      <button
        onClick={handleAction}
        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 ${
          status.is_clocked_in 
            ? "bg-black text-[#FFCC00] hover:bg-rose-600 hover:text-white" 
            : "bg-[#FFCC00] text-black hover:bg-black hover:text-[#FFCC00]"
        }`}
      >
        {status.is_clocked_in ? (
          <> <FaSignOutAlt /> Terminate Shift </>
        ) : (
          <> <FaSignInAlt /> Initialize Shift </>
        )}
      </button>
    </div>
  );
}