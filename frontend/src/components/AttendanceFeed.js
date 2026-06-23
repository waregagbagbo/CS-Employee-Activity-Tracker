import React from "react";
import { Calendar, Clock, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

const stateStyleMap = {
  clocked_in: "bg-amber-50 text-amber-700 border border-amber-100",
  clocked_out: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  on_break: "bg-blue-50 text-blue-700 border border-blue-100"
};

export default function AttendanceFeed({ items }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm font-black uppercase tracking-wider text-xs text-gray-400">
        No attendance metrics logged on this deployment node
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-black">
      {items.map((row) => {
        const shiftName = row.shift_info?.static_shift?.name || "Unscheduled Block";
        const isWarning = row.validation_error && row.validation_error !== "None";

        return (
          <div key={row.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col gap-3 relative transition-all">

            {/* HEADER METRICS METRICS ROW */}
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                  Ref: #{row.id}
                </span>
                <span className="text-[10px] font-black uppercase tracking-tight text-neutral-900">
                  {shiftName}
                </span>
              </div>

              {/* Status Code Layout */}
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                stateStyleMap[row.status] || "bg-gray-100 text-gray-500 border border-gray-200"
              }`}>
                {row.status?.replace("_", " ")}
              </span>
            </div>

            {/* TIMELINES BLOCK METRIC LAYOUT GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-gray-600 pt-2 border-t border-gray-50/60">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                <span>Clock In: <strong className="text-black">{new Date(row.clock_in_time).toLocaleTimeString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                <span>Clock Out: <strong className="text-black">{row.clock_out_time ? new Date(row.clock_out_time).toLocaleTimeString() : "—"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                <span>Duration: <strong className="text-black">{row.duration_hours || "0.00"} Hrs</strong></span>
              </div>
            </div>

            {/* METADATA ERROR COMPLIANCE AUDITING BARS */}
            {isWarning && (
              <div className="text-[10px] font-black uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100 p-3 rounded-xl flex items-start gap-1.5 mt-1">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                <div>
                  <p>Audit Alert: {row.validation_error}</p>
                  {row.validation_message && <span className="font-mono text-[9px] text-gray-400 block mt-0.5">{row.validation_message}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
