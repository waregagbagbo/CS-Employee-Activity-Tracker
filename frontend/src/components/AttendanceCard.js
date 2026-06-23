import React, { useState } from "react";
import { LogIn, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AttendanceService } from "../services/attendance";

export default function AttendanceCard({ activeRecord, onStatusChange }) {
  const [shiftId, setShiftId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleClockIn = async (e) => {
    e.preventDefault();
    if (!shiftId) return;
    setLoading(true);
    setFeedback(null);

    try {
      const data = await AttendanceService.clockIn(shiftId);
      setShiftId("");
      onStatusChange(); // Instantly sync pages tracking list layouts
      setFeedback({ type: "success", msg: `Successfully Clocked In. Record ID: #${data.id}` });
    } catch (err) {
      setFeedback({ type: "error", msg: err.response?.data?.error || "Clock In Refused" });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;
    setLoading(true);
    setFeedback(null);

    try {
      const data = await AttendanceService.clockOut(activeRecord.id);
      onStatusChange();
      setFeedback({
        type: data.success ? "success" : "warning",
        msg: data.message || `Clocked out. Duration: ${data.attendance?.duration_hours || "0"} hrs.`
      });
    } catch (err) {
      setFeedback({ type: "error", msg: err.response?.data?.error || "Clock Out Refused" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4 font-sans text-black">
      <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Terminal Punch Clock
        </h3>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
          activeRecord ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" : "bg-gray-100 text-gray-500 border-gray-200"
        }`}>
          {activeRecord ? "Shift In Progress" : "Offline / Off Duty"}
        </span>
      </div>

      {/* STATUS SYSTEM ALERTS BLOCK */}
      {feedback && (
        <div className={`text-[10px] font-black uppercase tracking-widest p-4 rounded-xl border flex items-center gap-2 ${
          feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
          feedback.type === "warning" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}
          <span>{feedback.type === "error" ? `Error: ${feedback.msg}` : feedback.msg}</span>
        </div>
      )}

      {activeRecord ? (
        /* ACTIVE CLOCK OUT INTERFACES LAYOUT */
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-neutral-400">Active Duty Node Reference</p>
            <h4 className="font-black text-sm text-neutral-900 mt-0.5">Record ID: #{activeRecord.id}</h4>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block mt-1">
              Started: {new Date(activeRecord.clock_in_time).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="w-full sm:w-auto bg-black text-[#FFCC00] px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 hover:bg-neutral-900 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <LogOut size={14} /> End Deployment Block
          </button>
        </div>
      ) : (
        /* PUNCH INITIALIZATION INPUT ELEMENT FORM */
        <form onSubmit={handleClockIn} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              Assigned Shift Identifier ID *
            </label>
            <input
              type="number"
              placeholder="e.g. 15"
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !shiftId}
            className="w-full sm:w-auto bg-[#FFCC00] text-black px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 hover:bg-black hover:text-[#FFCC00] transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <LogIn size={14} /> Initialize Shift
          </button>
        </form>
      )}
    </div>
  );
}
