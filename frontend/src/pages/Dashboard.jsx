import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Calendar, Users, Layers, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LiveLogs from "../components/LiveLogs";
import {AttendanceService} from "../services/attendance";

// Explicit array mapping directly to your backend SHIFT_TYPES models.py variables
const SHIFT_TYPES = [
  { value: "day_shift", label: "🌅 Day Shift" },
  { value: "late_shift", label: "☀️ Late Shift" },
  { value: "recon_shift", label: "🔄 RS Shift (Recon)" },
  { value: "night_shift", label: "🌙 Night Shift" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const user = localStorage.getItem("username") || "Agent";
  const userRole = localStorage.getItem("user_role") || "Employee";
  const isSupervisor = ["Supervisor", "Manager", "Admin"].includes(userRole);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch true attendance shift state mapping right out of your service
  const fetchAttendanceStatus = useCallback(async () => {
    try {
      const res = await AttendanceService.getStatus();
      setStatus(res);
      if (res?.shift_type) {
        setSelectedShift(res.shift_type);
      }
    } catch (err) {
      console.error("Attendance registry sync failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
    };
  }, [fetchAttendanceStatus]);

  const handleClockIn = async (shiftValue) => {
    try {
      const res = await AttendanceService.clockIn({ shift_type: shiftValue });
      setStatus(res);
      setSelectedShift(shiftValue);
    } catch (err) {
      console.error("Clock-in execution failed:", err);
    }
  };

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">

      {/* SIDEBAR WRAPPER LAYOUT */}
      <aside className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar closeMobile={() => setSidebarOpen(false)} />
      </aside>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* CORE FRAMEWORK TERMINAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="flex items-center bg-white border-b border-gray-100 lg:border-none">
          <button onClick={() => setSidebarOpen(true)} className="p-4 lg:hidden text-black font-bold text-xl">☰</button>
          <div className="flex-1"><Topbar title="Command Center" user={user} /></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-6 pb-24">

          {/* PREMIUM EXECUTIVE HERO BLOCK */}
          <section className="bg-black p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-4 border-[#FFCC00] gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FFCC00] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-md">Operations Status Active</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase mt-3">
                Good {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.split(' ')[0]}
              </h1>
              <p className="text-gray-400 mt-1.5 text-xs font-medium">System operational. Ready for deployment schedules configuration mapping.</p>
            </div>

            {/* Clock Overlay Segment */}
            <div className="bg-neutral-900 border border-neutral-800 px-5 py-3 rounded-2xl flex items-center gap-3 self-start sm:self-auto shadow-inner">
              <Clock size={18} className="text-[#FFCC00]" />
              <div className="font-mono text-right">
                <div className="text-sm font-black text-white">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          </section>

          {/* DYNAMIC CONTENT GRID SPLIT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT SIDE WORKSPACE LAYOUT (8 COLS) */}
            <div className="xl:col-span-8 space-y-6">

              {/* Minimal Attendance & Deployment Panel Layout */}
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#FFCC00]" />
                    Today's Active Deployment Channels
                  </h3>
                  <span className="text-[10px] bg-neutral-100 font-black px-2.5 py-1 rounded-md uppercase tracking-wider text-neutral-600">
                    {loading ? "Syncing..." : selectedShift ? "Shift Active" : "No active shift"}
                  </span>
                </div>

                <ul className="space-y-3">
                  {SHIFT_TYPES.map((shift) => (
                    <li key={shift.value} className="flex justify-between items-center bg-gray-50/70 rounded-xl p-4 border border-gray-100/60 transition-all hover:bg-gray-50">
                      <span className="font-bold text-xs uppercase tracking-tight text-neutral-800">{shift.label}</span>

                      {selectedShift === shift.value ? (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 animate-pulse">
                          Active Allocation
                        </span>
                      ) : selectedShift ? (
                        <button disabled className="px-4 py-2 text-[9px] font-black uppercase bg-gray-100 text-gray-400 border border-gray-100 rounded-lg cursor-not-allowed">
                          Locked
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClockIn(shift.value)}
                          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-[#FFCC00] text-black rounded-lg hover:bg-black hover:text-[#FFCC00] transition-all shadow-sm active:scale-95"
                        >
                          Clock In
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* STREAMLINED NAVIGATION LINKS MODULE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { title: "Schedule", icon: <Calendar size={16} />, route: "/shifts" },
                  { title: "Reports Log", icon: <ClipboardList size={16} />, route: "/reports" },
                  { title: "Personnel Team", icon: <Users size={16} />, route: "/employees", managementOnly: true },
                  { title: "Departments", icon: <Layers size={16} />, route: "/departments", managementOnly: true }
                ].map((m, i) => {
                  if (m.managementOnly && !isSupervisor) return null;

                  return (
                    <div
                      key={i}
                      onClick={() => navigate(m.route)}
                      className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#FFCC00] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-black mb-4 group-hover:bg-[#FFCC00] transition-colors">
                        {m.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest group-hover:text-black transition-colors">
                          {m.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT SIDE STREAM CONTENT LAYOUT (4 COLS) */}
            <div className="xl:col-span-4">
              <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm h-full flex flex-col min-w-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#FFCC00]" />
                  Live Operational Activity Feed
                </h3>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <LiveLogs />
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
