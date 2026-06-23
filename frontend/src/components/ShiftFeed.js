import React from "react";
import { Calendar, Clock, User } from "lucide-react";

const statusStyles = {
  shift_scheduled: "bg-blue-50 text-blue-700 border border-blue-100",
  shift_in_progress: "bg-amber-50 text-amber-700 border border-amber-100",
  shift_completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  no_show: "bg-rose-50 text-rose-700 border border-rose-100",
};

const labels = {
  shift_scheduled: "Scheduled", shift_in_progress: "Active", shift_completed: "Completed", no_show: "No Show",
  day_shift: "Day Shift", late_shift: "Late Shift", recon_shift: "RS Shift", night_shift: "Night Shift"
};

export default function ShiftFeed({ shifts }) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
        No deployments allocated on this view
      </div>
    );
  }

  const formatTime = (ts) => ts ? new Date(`2000-01-01T${ts}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div className="flex flex-col gap-4 font-sans text-black">
      {shifts.map((shift) => (
        <div key={shift.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col gap-3 relative">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                {labels[shift.static_shift?.shift_type] || "General"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-tight text-neutral-900">
                {shift.static_shift?.name || "Shift Block"} · #{shift.id}
              </span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusStyles[shift.shift_status] || "bg-gray-100"}`}>
              {labels[shift.shift_status] || shift.shift_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] font-bold text-gray-500 border-t border-gray-50">
            <div className="flex items-center gap-1"><User size={12}/> Agent: <strong className="text-black ml-0.5">{shift.shift_agent?.user?.username || "Agent"}</strong></div>
            <div className="flex items-center gap-1"><Calendar size={12}/> Date: <strong className="text-black ml-0.5">{shift.shift_date}</strong></div>
            <div className="flex items-center gap-1"><Clock size={12}/> Time: <strong className="text-black ml-0.5">{formatTime(shift.static_shift?.start_time)} - {formatTime(shift.static_shift?.end_time)}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );
}
