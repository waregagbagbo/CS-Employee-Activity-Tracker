import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

const labelMap = {
  day_shift: "Day", late_shift: "Late", recon_shift: "RS Shift", night_shift: "Night",
  End_of_Shift: "EOS", Emergency: "Emergency", Break: "Break", Other: "General"
};

export default function ReportFeed({ reports, isSupervisor, onApproveReport }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
        No records on file
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col gap-3 relative">

          {/* HEADER ROW */}
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                {labelMap[report.shift_activity_type] || report.shift_activity_type}
              </span>
              <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                {labelMap[report.report_type] || report.report_type}
              </span>
              <span className="text-[10px] font-bold text-gray-900">
                {report.employee_name || "Agent"} · Ref #{report.id}
              </span>
            </div>

            <div>
              {report.is_approved ? (
                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 size={10}/> Approved
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-full flex items-center gap-0.5">
                  <Clock size={10}/> Pending
                </span>
              )}
            </div>
          </div>

          {/* ACTION DESCRIPTION TEXT ONLY */}
          <div className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50/50 p-3 rounded-xl border-l-2 border-black">
            {report.activity_description}
          </div>

          {/* COMPACT SUPERVISOR ACTION RUNNER BUTTON */}
          {isSupervisor && !report.is_approved && (
            <button
              onClick={() => onApproveReport(report.id)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-emerald-700 self-start transition-all"
            >
              Approve Log
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
