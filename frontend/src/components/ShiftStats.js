import React from "react";
import { Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

export default function ShiftStats({ shifts }) {
  const stats = {
    total: shifts.length,
    completed: shifts.filter(s => s.shift_status === 'shift_completed').length,
    inProgress: shifts.filter(s => s.shift_status === 'shift_in_progress').length,
    scheduled: shifts.filter(s => s.shift_status === 'shift_scheduled').length,
    assigned: shifts.filter(s => s.shift_agent).length,
    unassigned: shifts.filter(s => !s.shift_agent).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-blue-600" />
          <span className="text-xs font-black text-blue-600 uppercase">Total</span>
        </div>
        <p className="text-2xl font-black text-blue-700">{stats.total}</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={16} className="text-emerald-600" />
          <span className="text-xs font-black text-emerald-600 uppercase">Completed</span>
        </div>
        <p className="text-2xl font-black text-emerald-700">{stats.completed}</p>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={16} className="text-amber-600" />
          <span className="text-xs font-black text-amber-600 uppercase">In Progress</span>
        </div>
        <p className="text-2xl font-black text-amber-700">{stats.inProgress}</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-purple-600" />
          <span className="text-xs font-black text-purple-600 uppercase">Scheduled</span>
        </div>
        <p className="text-2xl font-black text-purple-700">{stats.scheduled}</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-green-600" />
          <span className="text-xs font-black text-green-600 uppercase">Assigned</span>
        </div>
        <p className="text-2xl font-black text-green-700">{stats.assigned}</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={16} className="text-red-600" />
          <span className="text-xs font-black text-red-600 uppercase">Unassigned</span>
        </div>
        <p className="text-2xl font-black text-red-700">{stats.unassigned}</p>
      </div>
    </div>
  );
}