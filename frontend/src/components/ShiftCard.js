import React from "react";
import { Clock, Calendar, User, AlertCircle, CheckCircle } from "lucide-react";

export default function ShiftCard({ shift, onClick, onEdit, onDelete, userType }) {
  const getStatusColor = (status) => {
    const colors = {
      shift_completed: "border-l-4 border-emerald-500",
      shift_in_progress: "border-l-4 border-blue-500",
      shift_incomplete: "border-l-4 border-yellow-500",
      no_show: "border-l-4 border-rose-500",
      shift_scheduled: "border-l-4 border-amber-500",
    };
    return colors[status] || "border-l-4 border-gray-500";
  };

  const getStatusBadge = (status) => {
    const badges = {
      shift_completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed" },
      shift_in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
      shift_incomplete: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Incomplete" },
      no_show: { bg: "bg-rose-100", text: "text-rose-700", label: "No Show" },
      shift_scheduled: { bg: "bg-amber-100", text: "text-amber-700", label: "Scheduled" },
    };
    const badge = badges[status] || { bg: "bg-gray-100", text: "text-gray-700", label: "Unknown" };
    return <span className={`inline-block ${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-bold`}>{badge.label}</span>;
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 ${getStatusColor(shift.shift_status)} cursor-pointer hover:shadow-lg transition-all`} onClick={onClick}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black uppercase">{shift.static_shift?.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase mt-1">
            <Calendar size={12} />
            {new Date(shift.shift_date).toLocaleDateString()}
          </div>
        </div>
        {getStatusBadge(shift.shift_status)}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Clock size={14} className="text-gray-400" />
          <span>{shift.static_shift?.start_time} - {shift.static_shift?.end_time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <User size={14} className="text-gray-400" />
          <span>{shift.shift_agent?.user?.first_name || "Unassigned"}</span>
        </div>
      </div>

      {userType === "supervisor" && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(shift.id); }} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">
            Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(shift.id); }} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}