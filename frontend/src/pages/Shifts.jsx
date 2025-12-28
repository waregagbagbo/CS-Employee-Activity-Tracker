import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listShifts, startShift, endShift } from "../services/shifts";
import {
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaClock,
  FaUser,
  FaEye,
  FaPlay,
  FaStop,
  FaLock,
  FaShieldAlt,
  FaPlusCircle
} from "react-icons/fa";

export default function Shifts() {
  const navigate = useNavigate();

  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [userRole, setUserRole] = useState("");
  const [canEditShifts, setCanEditShifts] = useState(false);
  const [canCreateReports, setCanCreateReports] = useState(false);
  const [canApproveReports, setCanApproveReports] = useState(false);

  // LOGIC: Enable shift creation only for non-admin and non-supervisors
  const canCreateShift = userRole !== "Admin" && userRole !== "Supervisor" && userRole !== "";

  useEffect(() => {
    fetchUserRole();
    fetchShifts();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8000/api/employee/me", {
        headers: { Authorization: `Token ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();
      const profile = data.results ? data.results[0] : data;
      const userType = profile?.user_type || "";

      setUserRole(userType);

      if (userType === "Admin") {
        setCanEditShifts(true);
        setCanCreateReports(true);
        setCanApproveReports(true);
      } else if (userType === "Employee_Agent") {
        setCanEditShifts(true);
        setCanCreateReports(true);
      } else if (userType === "Supervisor") {
        setCanApproveReports(true);
      }
    } catch (err) {
      console.error("Role fetch failed", err);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await listShifts();
      const data = res.data.results || res.data;
      const normalized = data.map((shift) => ({
        id: shift.id,
        title: shift.shift_type,
        status: shift.shift_status,
        date: shift.shift_date?.shift_date,
        start_time: shift.shift_start_time,
        end_time: shift.shift_end_time,
        timer: shift.shift_timer_count,
        agentName: shift.shift_agent?.username || "N/A"
      }));
      setShifts(normalized);
      setFilteredShifts(normalized);
    } catch (err) {
      setError("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredShifts(
      shifts.filter((s) =>
        s.title.toLowerCase().includes(term) || s.agentName.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, shifts]);

  const handleStart = async (id) => {
    try { await startShift(id); fetchShifts(); }
    catch { alert("Cannot start shift"); }
  };

  const handleEnd = async (id) => {
    try { await endShift(id); fetchShifts(); }
    catch (err) { alert(err.response?.data?.error || "Cannot end shift"); }
  };

  const statusBadge = (status) => {
    if (status === "Scheduled") return "bg-black text-[#FFCC00] border-black";
    if (status === "In Progress") return "bg-[#FFCC00] text-black border-[#FFCC00]";
    return "bg-gray-100 text-gray-400 border-gray-200";
  };

  if (loading) return <Loader fullPage message="Synchronizing Shifts..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 lg:p-12">

        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black flex items-center">
              Shift <span className="text-[#FFCC00] ml-3">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
              <FaShieldAlt className="text-[#FFCC00]" /> Auth Protocol: {userRole || "Initializing..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* ACTION: CREATE SHIFT (Limited to Agents) */}
            {canCreateShift && (
              <button
                onClick={() => navigate("/shifts/new")}
                className="group bg-[#FFCC00] text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-[#FFCC00] transition-all shadow-xl flex items-center gap-3"
              >
                <FaPlusCircle className="text-lg group-hover:rotate-90 transition-transform" />
                Initialize Shift
              </button>
            )}

            {/* ACTION: ADD REPORT */}
            {canCreateReports && (
              <button
                onClick={() => navigate("/reports/new")}
                className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#FF8800] transition-all shadow-xl"
              >
                Post Activity
              </button>
            )}

            {/* ACTION: APPROVALS */}
            {canApproveReports && (
              <button
                onClick={() => navigate("/reports")}
                className="bg-white border-2 border-black text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-[#FFCC00] transition-all shadow-lg"
              >
                Validate Logs
              </button>
            )}
          </div>
        </header>

        {/* Search Console */}
        <div className="relative mb-12 group">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFCC00] transition-colors" />
          <input
            className="w-full pl-16 pr-8 py-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#FFCC00]/20 text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
            placeholder="FILTER BY MISSION TYPE OR PERSONNEL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Shifts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className="group bg-white rounded-[3rem] border border-gray-100 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 relative overflow-hidden"
            >
              {/* Status Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-[#FFCC00] transition-all duration-300">
                  <FaClock size={20} />
                </div>
                <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] italic border shadow-sm ${statusBadge(shift.status)}`}>
                  {shift.status}
                </span>
              </div>

              {/* Shift Info */}
              <h3 className="font-black text-2xl italic uppercase tracking-tighter text-black mb-6 group-hover:text-[#FF8800] transition-colors">
                {shift.title}
              </h3>

              <div className="space-y-4 mb-10">
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <FaUser className="mr-4 text-[#FFCC00]" />
                  Agent: <span className="text-black ml-2">{shift.agentName}</span>
                </div>
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <FaCalendarAlt className="mr-4 text-black" />
                  Window: <span className="text-black ml-2">{shift.start_time || "00:00"} — {shift.end_time || "00:00"}</span>
                </div>
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-tighter italic">
                  <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                  Active Timer: {shift.timer}
                </div>
              </div>

              {/* Action Deck */}
              <div className="flex gap-3 pt-8 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/shifts/${shift.id}`)}
                  className="flex-1 bg-gray-50 text-black hover:bg-black hover:text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all"
                >
                  <FaEye className="inline mr-2" /> View
                </button>

                {shift.status === "Scheduled" && canEditShifts && (
                  <button
                    onClick={() => handleStart(shift.id)}
                    className="flex-1 bg-[#FFCC00] text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    <FaPlay className="inline mr-2" /> Start
                  </button>
                )}

                {shift.status === "In Progress" && canEditShifts && (
                  <button
                    onClick={() => handleEnd(shift.id)}
                    className="flex-1 bg-black text-[#FFCC00] py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    <FaStop className="inline mr-2" /> End
                  </button>
                )}

                {!canEditShifts && (
                  <button
                    disabled
                    className="flex-1 bg-gray-100 text-gray-300 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <FaLock size={10} /> Secure
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredShifts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-50 mt-12">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <FaCalendarAlt className="text-gray-200 text-3xl" />
            </div>
            <p className="text-gray-300 font-black italic uppercase tracking-[0.3em]">No Mission Data Detected</p>
          </div>
        )}
      </div>
    </div>
  );
}