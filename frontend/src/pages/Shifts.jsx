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
  FaShieldAlt
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
        date: shift.shift_date,
        start_time: shift.shift_start_time,
        end_time: shift.shift_end_time,
        timer: shift.shift_timer_count,
        agentName: shift.shift_agent?.user?.username || "N/A"
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black flex items-center">
              Shift <span className="text-[#FFCC00] ml-2">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <FaShieldAlt className="text-[#FFCC00]" /> Role-Based Access: {userRole || "Fetching..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* ONLY FOR NON-ADMIN / NON-SUPERVISOR */}
            {canCreateShift && (
              <button
                onClick={() => navigate("/shifts/new")}
                className="bg-[#FFCC00] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
              >
                <FaPlus className="inline mr-2" /> Create Shift
              </button>
            )}

            {canCreateReports && (
              <button
                onClick={() => navigate("/reports/new")}
                className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg"
              >
                Add Report
              </button>
            )}

            {canApproveReports && (
              <button
                onClick={() => navigate("/reports")}
                className="bg-white border-2 border-black text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-[#FFCC00] transition-all"
              >
                Approve Reports
              </button>
            )}
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-10">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-sm font-medium"
            placeholder="SEARCH BY SHIFT TYPE OR AGENT NAME..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Shifts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                  <FaClock size={20} />
                </div>
                <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusBadge(shift.status)}`}>
                  {shift.status}
                </span>
              </div>

              <h3 className="font-black text-xl uppercase tracking-tight text-black mb-4">{shift.title}</h3>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <FaUser className="mr-3 text-[#FFCC00]" />
                  {shift.agentName}
                </div>
                <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <FaCalendarAlt className="mr-3 text-black" />
                  {shift.start_time || "--"} <span className="mx-2">→</span> {shift.end_time || "--"}
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-mono font-bold text-gray-400 italic">
                  TIMER: {shift.timer}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/shifts/${shift.id}`)}
                  className="flex-1 bg-gray-50 text-black hover:bg-black hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <FaEye className="inline mr-2" /> Details
                </button>

                {shift.status === "Scheduled" && canEditShifts && (
                  <button
                    onClick={() => handleStart(shift.id)}
                    className="flex-1 bg-[#FFCC00] text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                  >
                    <FaPlay className="inline mr-2" /> Start
                  </button>
                )}

                {shift.status === "In Progress" && canEditShifts && (
                  <button
                    onClick={() => handleEnd(shift.id)}
                    className="flex-1 bg-black text-[#FFCC00] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                  >
                    <FaStop className="inline mr-2" /> End
                  </button>
                )}

                {!canEditShifts && (
                  <button
                    disabled
                    className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <FaLock size={10} /> Locked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredShifts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 mt-10">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-100 mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest">No matching shift records found</p>
          </div>
        )}
      </div>
    </div>
  );
}