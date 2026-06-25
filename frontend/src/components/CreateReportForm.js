import React, { useState, useEffect } from "react";
import ReportService from "../services/reports";
import AttendanceService from "../services/attendance";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function CreateReportForm() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Agent";

  const [form, setForm] = useState({
    attendance: "",
    shift_activity_type: "Day_Shift",
    report_type: "incident",
    activity_description: "",
    tickets_resolved: 0,
    calls_made: 0,
    issues_escalated: 0,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [attendanceOptions, setAttendanceOptions] = useState([]);

  // Fetch available attendances
  useEffect(() => {
    const fetchAttendances = async () => {
      setLoading(true);
      try {
        const data = await AttendanceService.list({
          clock_out_time__isnull: false,
        });
        const records = data.results || data;
        setAttendanceOptions(records);
      } catch (err) {
        setError("Failed to load attendance records");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendances();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.attendance) {
      setError("Please select an attendance record");
      return;
    }

    if (!form.activity_description.trim()) {
      setError("Activity description is required");
      return;
    }

    setSubmitting(true);
    try {
      await ReportService.create(form);
      setSuccess("Report submitted successfully!");
      setTimeout(() => navigate("/reports"), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to submit report";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Submit Activity Report" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-3xl mx-auto">
            {/* HEADER */}
            <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white mb-8 border-b-4 border-[#FFCC00]">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">
                Activity Report
              </h1>
              <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">
                Document your shift activities and metrics
              </p>
            </section>

            {/* ERROR ALERT */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-black uppercase text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* SUCCESS ALERT */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-black uppercase text-sm">{success}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
              {/* Attendance Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  Select Attendance Record *
                </label>
                <select
                  name="attendance"
                  value={form.attendance}
                  onChange={handleChange}
                  required
                  className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                >
                  <option value="">— Choose a clock-out record —</option>
                  {attendanceOptions.map((att) => (
                    <option key={att.id} value={att.id}>
                      {new Date(att.clock_in_time).toLocaleDateString()} •{" "}
                      {new Date(att.clock_in_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {att.duration_hours}h
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Type & Report Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Shift Type
                  </label>
                  <select
                    name="shift_activity_type"
                    value={form.shift_activity_type}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]"
                  >
                    <option value="Day_Shift">Day Shift</option>
                    <option value="Night_Shift">Night Shift</option>
                    <option value="Evening_Shift">Evening Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Report Type
                  </label>
                  <select
                    name="report_type"
                    value={form.report_type}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]"
                  >
                    <option value="incident">Incident</option>
                    <option value="routine">Routine</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Activity Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  Activity Description *
                </label>
                <textarea
                  name="activity_description"
                  value={form.activity_description}
                  onChange={handleChange}
                  placeholder="Describe what you accomplished during your shift..."
                  required
                  rows={5}
                  className="w-full p-4 border border-gray-200 rounded-2xl font-medium text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent resize-none"
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Tickets Resolved
                  </label>
                  <input
                    type="number"
                    name="tickets_resolved"
                    value={form.tickets_resolved}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Calls Made
                  </label>
                  <input
                    type="number"
                    name="calls_made"
                    value={form.calls_made}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Issues Escalated
                  </label>
                  <input
                    type="number"
                    name="issues_escalated"
                    value={form.issues_escalated}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional comments..."
                  rows={3}
                  className="w-full p-4 border border-gray-200 rounded-2xl font-medium text-sm focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                  submitting
                    ? "bg-gray-300 text-gray-600"
                    : "bg-[#FFCC00] text-black hover:bg-white"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}