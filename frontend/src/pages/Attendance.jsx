import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Added back based on your previous structure
import {
  listAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  retrieveAttendance
} from "../services/attendance";
import {
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus,
  FaTachometerAlt, FaUserCircle, FaClock, FaTrash, FaEdit, FaSave, FaEye, FaTimes, FaShieldAlt
} from "react-icons/fa";

export default function Attendance() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "OPERATOR_01";

  const [attendance, setAttendance] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
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
      setError("LEDGER SYNC ERROR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(page);
  }, [page]);

  // --- RETRIEVE LOGIC ---
  const handleViewDetails = async (id) => {
    try {
      const res = await retrieveAttendance(id);
      setSelectedRecord(res.data);
    } catch (err) {
      setError("CRITICAL: DATA RETRIEVAL FAILED.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await createAttendance(formData);
      setSuccess("RECORD COMMITTED TO LEDGER.");
      setFormData({ date: new Date().toISOString().split('T')[0], status: "Present", remarks: "" });
      fetchAttendance(page);
    } catch (err) {
      setError("AUTH FAILURE: ACTION REJECTED.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateAttendance(id, editData);
      setEditingId(null);
      setSuccess("RECORD RECTIFIED.");
      fetchAttendance(page);
    } catch (err) {
      setError("UPDATE ABORTED.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("PURGE THIS LOG FROM THE REGISTRY?")) return;
    try {
      await deleteAttendance(id);
      setSuccess("RECORD PURGED.");
      fetchAttendance(page);
    } catch (err) {
      setError("PURGE BLOCKED: INSUFFICIENT CLEARANCE.");
    }
  };

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen font-sans">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black">
                Attendance <span className="text-[#FFCC00]">Registry</span>
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                <FaShieldAlt className="text-[#FFCC00]" /> Operational Status: Live Tracking
              </p>
            </div>
            <div className="flex items-center gap-4 bg-black p-4 rounded-3xl text-white shadow-xl">
               <FaUserCircle className="text-[#FFCC00] text-xl" />
               <div className="pr-4 border-r border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#FFCC00]">{user}</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">System Access: Verified</p>
               </div>
               <FaClock className="text-[#FFCC00] animate-pulse ml-2" />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Create Section */}
            <div className="lg:col-span-4">
              <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl sticky top-10 border border-black overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFCC00] opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>

                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3 text-[#FFCC00] mb-10">
                  <FaPlus size={14} className="group-hover:rotate-90 transition-transform" /> Initialize Record
                </h3>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Reporting Date</label>
                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white focus:border-[#FFCC00] outline-none font-bold transition-all"
                      value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Registry Status</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white outline-none appearance-none font-bold cursor-pointer focus:border-[#FFCC00] transition-all"
                      value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option className="text-black" value="Present">PRESENT</option>
                      <option className="text-black" value="Absent">ABSENT</option>
                      <option className="text-black" value="Late">LATE</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#FFCC00] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white transition-all shadow-xl active:scale-95">
                    Commit Entry
                  </button>
                  {success && <p className="text-[#FFCC00] text-[9px] font-black uppercase text-center tracking-widest bg-[#FFCC00]/10 py-3 rounded-xl border border-[#FFCC00]/20 italic">✓ {success}</p>}
                  {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center tracking-widest italic animate-bounce">! {error}</p>}
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-black italic">Archived Registry Logs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-10 py-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Temporal Node</th>
                        <th className="px-10 py-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Compliance</th>
                        <th className="px-10 py-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] text-right">Audit Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attendance.map((att) => (
                        <tr key={att.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-10 py-8 font-black italic text-black text-base">{att.date}</td>
                          <td className="px-10 py-8">
                            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-widest border ${
                              att.status === 'Present' ? 'bg-black text-[#FFCC00] border-black' : 
                              att.status === 'Late' ? 'bg-[#FFCC00] text-black border-[#FFCC00]' : 
                              'bg-rose-600 text-white border-rose-600'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex justify-end gap-5">
                              {/* TRIGGER RETRIEVE */}
                              <button onClick={() => handleViewDetails(att.id)} className="text-gray-300 hover:text-[#FFCC00] transition-colors"><FaEye size={16} /></button>
                              <button onClick={() => { setEditingId(att.id); setEditData(att); }} className="text-gray-300 hover:text-black transition-colors"><FaEdit size={16} /></button>
                              <button onClick={() => handleDelete(att.id)} className="text-gray-200 hover:text-rose-600 transition-colors"><FaTrash size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-10 py-8 bg-gray-50/30 flex justify-between items-center border-t border-gray-100">
                  <button disabled={!prevPage} onClick={() => setPage(p => p - 1)} className="px-6 py-3 bg-black text-[#FFCC00] rounded-2xl disabled:opacity-10 transition-all font-black text-[10px] uppercase">Prev Node</button>
                  <button disabled={!nextPage} onClick={() => setPage(p => p + 1)} className="px-6 py-3 bg-black text-[#FFCC00] rounded-2xl disabled:opacity-10 transition-all font-black text-[10px] uppercase">Next Node</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RETRIEVE MODAL (ONA-STYLE) --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] overflow-hidden shadow-2xl relative">
            <div className="bg-black p-10 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00] opacity-5 rounded-full -mr-20 -mt-20"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.4em] mb-3">Audit Protocol 7.2</p>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">Log <span className="text-[#FFCC00]">#{selectedRecord.id}</span></h2>
               </div>
               <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-white relative z-10"><FaTimes size={24}/></button>
            </div>

            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                 <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-2">Registry Date</p>
                    <p className="text-lg font-black italic">{selectedRecord.date}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-2">Compliance Rating</p>
                    <span className="px-3 py-1 bg-black text-[#FFCC00] text-[10px] font-black rounded-lg italic uppercase">{selectedRecord.status}</span>
                 </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] mb-4">Official Remarks</p>
                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 italic text-gray-600 leading-relaxed text-sm">
                  {selectedRecord.remarks || "NO SUPPLEMENTARY INCIDENT DATA RECORDED FOR THIS ENTRY."}
                </div>
              </div>

              <button onClick={() => setSelectedRecord(null)} className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#FFCC00] hover:text-black transition-all">
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}