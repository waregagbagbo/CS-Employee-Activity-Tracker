import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ShiftService from "../services/shifts";
import { useNavigate } from "react-router-dom";
import {
  Clock, Calendar, AlertCircle, CheckCircle, Loader,
  Eye, Edit2, Trash2, Plus, TrendingUp, Search
} from "lucide-react";

export default function Shifts() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Admin";
  const userType = localStorage.getItem("user_type") || "employee_agent";

  const [tab, setTab] = useState("today"); // today, upcoming, history, all
  const [todayShifts, setTodayShifts] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [historyShifts, setHistoryShifts] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchShiftData();
  }, []);

  const fetchShiftData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [today, upcoming, history, all] = await Promise.all([
        ShiftService.getTodayShifts().catch(() => []),
        ShiftService.getUpcomingShifts().catch(() => []),
        ShiftService.getShiftHistory(30).catch(() => []),
        ShiftService.list().catch(() => []),
      ]);

      setTodayShifts(Array.isArray(today) ? today : today.results || []);
      setUpcomingShifts(Array.isArray(upcoming) ? upcoming : upcoming.results || []);
      setHistoryShifts(Array.isArray(history) ? history : history.results || []);
      setAllShifts(Array.isArray(all) ? all : all.results || []);
    } catch (err) {
      setError("Failed to load shifts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shift?")) return;
    setDeleting(id);
    try {
      await ShiftService.delete(id);
      fetchShiftData();
    } catch {
      setError("Failed to delete shift");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (shift) => {
    if (!shift.shift_agent) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
          <AlertCircle size={12} /> Unassigned
        </span>
      );
    }

    const statuses = {
      shift_completed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle size={12} />, label: "Completed" },
      shift_in_progress: { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock size={12} />, label: "In Progress" },
      shift_incomplete: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertCircle size={12} />, label: "Incomplete" },
      no_show: { bg: "bg-rose-100", text: "text-rose-700", icon: <AlertCircle size={12} />, label: "No Show" },
    };

    const status = statuses[shift.shift_status] || {
      bg: "bg-amber-100", text: "text-amber-700", icon: <Clock size={12} />, label: "Scheduled"
    };

    return (
      <span className={`inline-flex items-center gap-1 ${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-bold`}>
        {status.icon} {status.label}
      </span>
    );
  };

  const ShiftTable = ({ shifts }) => (
    <>
      {shifts.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100">
          <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest">No shifts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-[#FFCC00]">Date</th>
                  <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-[#FFCC00]">Shift</th>
                  <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-[#FFCC00]">Time</th>
                  <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-[#FFCC00]">Employee</th>
                  <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-[#FFCC00]">Status</th>
                  <th className="px-6 py-4 text-center font-black text-xs uppercase tracking-widest text-[#FFCC00]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-sm">{new Date(shift.shift_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase">{shift.static_shift?.name}</span></td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">{shift.static_shift?.start_time} - {shift.static_shift?.end_time}</td>
                    <td className="px-6 py-4 font-bold text-sm">{shift.shift_agent?.user?.first_name || "Unassigned"}</td>
                    <td className="px-6 py-4">{getStatusBadge(shift)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => { setSelectedShift(shift); setShowModal(true); }} className="p-2 bg-gray-50 rounded-lg hover:bg-black hover:text-[#FFCC00]" title="View">
                          <Eye size={14} />
                        </button>
                        {userType === "supervisor" && (
                          <>
                            <button onClick={() => navigate(`/edit-shift/${shift.id}`)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white" title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(shift.id)} disabled={deleting === shift.id} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-50" title="Delete">
                              {deleting === shift.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

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
        <Topbar title="Shift Schedule" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* HEADER */}
            <section className="bg-black p-8 rounded-[2.5rem] text-white border-b-4 border-[#FFCC00] flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">Shift Schedule</h1>
                <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">Manage your team shifts</p>
              </div>
              {userType === "supervisor" && (
                <button onClick={() => navigate("/create-shift")} className="bg-[#FFCC00] text-black px-8 py-4 rounded-2xl font-black uppercase hover:bg-white flex items-center gap-2">
                  <Plus size={18} /> New Shift
                </button>
              )}
            </section>

            {/* ERROR */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            {/* SEARCH */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl">
                <Search size={18} className="text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shifts..." className="flex-1 bg-transparent font-bold text-sm outline-none" />
              </div>
            </div>

            {/* TABS */}
            <div className="flex gap-3 flex-wrap">
              {[
                { key: "today", label: "Today", count: todayShifts.length },
                { key: "upcoming", label: "Next 7 Days", count: upcomingShifts.length },
                { key: "history", label: "History", count: historyShifts.length },
                { key: "all", label: "All Shifts", count: allShifts.length },
              ].map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase border flex items-center gap-2 ${tab === t.key ? "bg-black text-[#FFCC00] border-black" : "bg-white text-gray-400 border-gray-200 hover:border-black"}`}>
                  {t.label} <span className={`text-xs font-bold px-2 py-1 rounded-full ${tab === t.key ? "bg-[#FFCC00] text-black" : "bg-gray-200"}`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* STATS */}
            {tab === "today" && todayShifts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2.5rem] p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock size={20} className="text-blue-600" />
                    <span className="text-xs font-black text-blue-600 uppercase">Total Today</span>
                  </div>
                  <p className="text-3xl font-black text-blue-700">{todayShifts.length}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-[2.5rem] p-6 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} className="text-emerald-600" />
                    <span className="text-xs font-black text-emerald-600 uppercase">Completed</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-700">{todayShifts.filter(s => s.shift_status === 'shift_completed').length}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2.5rem] p-6 border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={20} className="text-amber-600" />
                    <span className="text-xs font-black text-amber-600 uppercase">In Progress</span>
                  </div>
                  <p className="text-3xl font-black text-amber-700">{todayShifts.filter(s => s.shift_status === 'shift_in_progress').length}</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT */}
            {tab === "today" && <ShiftTable shifts={todayShifts.filter(s => !search || s.static_shift?.name?.toLowerCase().includes(search.toLowerCase()))} />}
            {tab === "upcoming" && <ShiftTable shifts={upcomingShifts.filter(s => !search || s.static_shift?.name?.toLowerCase().includes(search.toLowerCase()))} />}
            {tab === "history" && <ShiftTable shifts={historyShifts.filter(s => !search || s.static_shift?.name?.toLowerCase().includes(search.toLowerCase()))} />}
            {tab === "all" && <ShiftTable shifts={allShifts.filter(s => !search || s.static_shift?.name?.toLowerCase().includes(search.toLowerCase()))} />}

            {/* MODAL */}
            {showModal && selectedShift && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Shift Details</h2>
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Date</label>
                      <p className="font-bold text-lg">{new Date(selectedShift.shift_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Shift Type</label>
                      <p className="font-bold text-lg">{selectedShift.static_shift?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Time</label>
                      <p className="font-bold text-lg">{selectedShift.static_shift?.start_time} - {selectedShift.static_shift?.end_time}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Employee</label>
                      <p className="font-bold text-lg">{selectedShift.shift_agent?.user?.first_name || "Unassigned"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Status</label>
                      {getStatusBadge(selectedShift)}
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-full bg-black text-[#FFCC00] px-6 py-3 rounded-2xl font-black uppercase hover:bg-gray-800">Close</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}