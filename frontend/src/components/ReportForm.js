import React, { useState } from "react";
import { ReportService } from "../services/reports";

// Explicit array constants mapping directly to your Django choice definitions
const SHIFT_TYPES = [
  { value: "day_shift", label: "🌅 Day Shift" },
  { value: "late_shift", label: "☀️ Late Shift" },
  { value: "recon_shift", label: "🔄 RS Shift (Recon)" },
  { value: "night_shift", label: "🌙 Night Shift" }
];

const REPORT_TYPES = [
  { value: "End_of_Shift", label: "📅 End of Shift Log" },
  { value: "Emergency", label: "🚨 Emergency Report" },
  { value: "Break", label: "🥪 Break Handover" },
  { value: "Other", label: "📂 Other / General Ops" }
];

export default function ReportForm({ onReportSubmitted }) {
  const [formData, setFormData] = useState({
    attendance: "",
    shift_activity_type: "night_shift", // Lowercase default to match your models.py SHIFT_TYPES
    report_type: "Other", // Pascal/Title case default matching REPORT_TYPES
    activity_description: "",
    tickets_resolved: 0,
    calls_made: 0,
    issues_escalated: 0,
    notes: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["tickets_resolved", "calls_made", "issues_escalated"].includes(name)
        ? Math.max(0, parseInt(value, 10) || 0)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await ReportService.createReport(formData);
      onReportSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to finalize activity log entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-black">
      {error && (
        <div className="bg-rose-50 text-rose-500 font-black uppercase text-[10px] tracking-widest p-4 rounded-xl border border-rose-100">
          ⚠️ Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Attendance Log ID *
          </label>
          <input
            type="number"
            name="attendance"
            placeholder="e.g. 104"
            value={formData.attendance}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Shift Activity Type
          </label>
          <select
            name="shift_activity_type"
            value={formData.shift_activity_type}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-black transition-all outline-none"
          >
            {SHIFT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
          Report Classification Type
        </label>
        <select
          name="report_type"
          value={formData.report_type}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-black transition-all outline-none"
        >
          {REPORT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Tickets Fixed
          </label>
          <input
            type="number"
            name="tickets_resolved"
            min="0"
            value={formData.tickets_resolved}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center outline-none focus:border-black transition-all"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Calls Made
          </label>
          <input
            type="number"
            name="calls_made"
            min="0"
            value={formData.calls_made}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center outline-none focus:border-black transition-all"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Escalations
          </label>
          <input
            type="number"
            name="issues_escalated"
            min="0"
            value={formData.issues_escalated}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center outline-none focus:border-black transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
          Activity Description *
        </label>
        <textarea
          name="activity_description"
          rows="4"
          placeholder="Provide an explicit, detailed breakdown of tasks handled during this shift window..."
          value={formData.activity_description}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all outline-none resize-none leading-relaxed"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
          System Handover Notes / Comments
        </label>
        <textarea
          name="notes"
          rows="2"
          placeholder="Open blocks, dependencies, equipment issues for next schedule block..."
          value={formData.notes}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all outline-none resize-none leading-relaxed"
        />
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-[#FFCC00] px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-900 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Filing Entry Records..." : "Publish Shift Log"}
        </button>
      </div>
    </form>
  );
}
