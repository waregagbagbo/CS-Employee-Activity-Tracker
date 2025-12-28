import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listAttendance, createAttendance } from "../services/attendance";
import {
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus,
  FaTachometerAlt, FaUserCircle, FaClock
} from "react-icons/fa";

export default function Attendance() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "ADMIN";

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "Present",
    remarks: ""
  });

  const fetchAttendance = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await listAttendance({ page: pageNum });
      setAttendance(res.data.results || res.data);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(page);
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await createAttendance(formData);
      setSuccess("Entry Logged.");
      setFormData({ date: new Date().toISOString().split('T')[0], status: "Present", remarks: "" });
      fetchAttendance(page);
    } catch (err) {
      setError("Unauthorized action.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Present": return "bg-black text-[#FFCC00] border-black";
      case "Late": return "bg-[#FFCC00] text-black border-[#FFCC00]";
      default: return "bg-gray-100 text-gray-400 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">

      {/* --- ONAFRIQ TOP NAVIGATION BAR --- */}
      <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-[#FFCC00] p-2 rounded-lg group-hover:rotate-12 transition-transform">
              <FaTachometerAlt className="text-black" />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-sm">Dashboard</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-[#FFCC00]">
            <FaClock size={12} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Registry Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest">{user}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Active Session</p>
          </div>
          <FaUserCircle className="text-2xl text-gray-600" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-10 px-6">

        {/* Breadcrumb / Back Navigation */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
        >
          <FaChevronLeft size={8} /> Back to Overview
        </button>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black">
              Attendance <span className="text-[#FFCC00]">Registry</span>
            </h1>
            <p className="mt-2 text-gray-500 font-medium uppercase text-xs tracking-[0.2em]">Workforce Compliance Monitoring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Record Entry Form */}
          <div className="lg:col-span-4">
            <div className="bg-black rounded-[2.5rem] shadow-2xl p-8 text-white border border-black">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-[#FFCC00] mb-8">
                <FaPlus size={14} /> New Record
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-[#FFCC00] transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                  <select
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-[#FFCC00] appearance-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option className="text-black" value="Present">Present</option>
                    <option className="text-black" value="Absent">Absent</option>
                    <option className="text-black" value="Late">Late</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Remarks</label>
                  <textarea
                    rows="3"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-[#FFCC00]"
                    placeholder="Enter notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FFCC00] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  Confirm Entry
                </button>
                {error && <p className="text-red-400 text-[10px] font-black uppercase text-center">{error}</p>}
                {success && <p className="text-[#FFCC00] text-[10px] font-black uppercase text-center">{success}</p>}
              </form>
            </div>
          </div>

          {/* Table List */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 font-black uppercase tracking-tighter">
                Recent Logs
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan="3" className="py-20 text-center text-gray-300 font-black uppercase">Syncing...</td></tr>
                    ) : (
                      attendance.map((att) => (
                        <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6 text-sm font-black italic text-black">{att.date}</td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(att.status)}`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => navigate(`/attendance/${att.id}`)} className="text-black hover:text-[#FFCC00] font-black text-[10px] uppercase">Details</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-8 py-6 bg-gray-50/50 flex justify-between">
                <button disabled={!prevPage} onClick={() => setPage(p => p - 1)} className="p-3 bg-black text-[#FFCC00] rounded-xl disabled:opacity-20 transition-all"><FaChevronLeft size={10} /></button>
                <button disabled={!nextPage} onClick={() => setPage(p => p + 1)} className="p-3 bg-black text-[#FFCC00] rounded-xl disabled:opacity-20 transition-all"><FaChevronRight size={10} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}