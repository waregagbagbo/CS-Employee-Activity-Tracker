import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ShiftService from "../services/shifts";
import {listEmployees} from "../services/employee";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader, ArrowLeft } from "lucide-react";

export default function EditShift() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = localStorage.getItem("username") || "Admin";

  const [form, setForm] = useState({ shift_agent: "", shift_date: "", static_shift: "", shift_status: "shift_scheduled" });
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shift, empData, shiftData] = await Promise.all([
        ShiftService.retrieve(id).catch(() => null),
        listEmployees().catch(() => ({ results: [] })),
        ShiftService.listShiftTemplates().catch(() => ({ results: [] })),
      ]);

      if (shift) {
        setForm({
          shift_agent: shift.shift_agent?.id || "",
          shift_date: shift.shift_date,
          static_shift: shift.static_shift?.id || "",
          shift_status: shift.shift_status || "shift_scheduled",
        });
      }

      setEmployees(Array.isArray(empData) ? empData : empData.results || []);
      setShifts(Array.isArray(shiftData) ? shiftData : shiftData.results || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.shift_date || !form.static_shift) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await ShiftService.partialUpdate(id, form);
      setSuccess("Shift updated successfully!");
      setTimeout(() => navigate("/shifts"), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update shift";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center"><Loader size={24} className="animate-spin text-gray-400" /></div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar title="Edit Shift" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-3xl mx-auto">

            <button onClick={() => navigate("/shifts")} className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 font-bold">
              <ArrowLeft size={18} /> Back to Shifts
            </button>

            <section className="bg-black p-8 rounded-[2.5rem] text-white mb-8 border-b-4 border-[#FFCC00]">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">Edit Shift</h1>
              <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">Update shift details</p>
            </section>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-bold uppercase text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-bold uppercase text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6">

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Assign Employee (Optional)</label>
                <select name="shift_agent" value={form.shift_agent} onChange={handleChange} className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]">
                  <option value="">— Unassigned —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.first_name} {emp.user?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Shift Date *</label>
                <input type="date" name="shift_date" value={form.shift_date} onChange={handleChange} required className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Shift Type *</label>
                <select name="static_shift" value={form.static_shift} onChange={handleChange} required className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]">
                  <option value="">— Select Shift Type —</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.start_time} - {shift.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Shift Status</label>
                <select name="shift_status" value={form.shift_status} onChange={handleChange} className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#FFCC00]">
                  <option value="shift_scheduled">Scheduled</option>
                  <option value="shift_in_progress">In Progress</option>
                  <option value="shift_completed">Completed</option>
                  <option value="shift_incomplete">Incomplete</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <button type="submit" disabled={submitting} className={`w-full px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 ${submitting ? "bg-gray-300 text-gray-600" : "bg-[#FFCC00] text-black hover:bg-white"}`}>
                {submitting ? <><Loader size={18} className="animate-spin" /> Updating...</> : "Update Shift"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}