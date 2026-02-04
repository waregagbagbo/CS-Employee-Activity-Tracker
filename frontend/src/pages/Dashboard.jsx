import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttendanceClock from "../components/AttendanceClock";
import { FaUsers, FaFileAlt, FaCalendarCheck, FaChartLine, FaPlus, FaArrowRight, FaBars, FaTimes } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { listEmployees } from "../services/employee";
import LiveLogs from "../components/LiveLogs";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const user = localStorage.getItem("username") || "Agent";
  const userType = localStorage.getItem("user_role") || "employee_agent";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [counts, setCounts] = useState({ employees: 0, depts: 0, shifts: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const empRes = await listEmployees({ page: 1 });
      setCounts({
        employees: empRes.data.count || 0,
        depts: empRes.data.count || 0,
        shifts: empRes.data.count || 0
      });
    } catch (err) { console.error("Sync Error", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Combined modules with specific styling
  const metrics = [
    { title: "Team Size", value: counts.employees, icon: <FaUsers />, route: "/employees" },
    { title: "Active Shifts", value: counts.shifts, icon: <FaCalendarCheck />, route: "/shifts" },
    { title: "Departments", value: counts.depts, icon: <FaPeopleGroup />, route: "/departments" },
    { title: "Avg Performance", value: "94%", icon: <FaChartLine />, route: "/attendance" },
  ];

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar closeMobile={() => setSidebarOpen(false)} />
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* TOPBAR / MOBILE HEADER */}
        <header className="flex items-center bg-white border-b border-gray-100 lg:border-none">
          <button onClick={() => setSidebarOpen(true)} className="p-4 lg:hidden text-black"><FaBars /></button>
          <div className="flex-1">
            <Topbar title="Command Center" user={user} />
          </div>
        </header>

        {/* 2. SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-8 pb-32">

          {/* HERO SECTION - Streamlined Status */}
          <section className="bg-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <FaCalendarCheck size={120} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFCC00]">Operations Active</span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase mt-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.split(' ')[0]}
              </h1>
              <p className="text-gray-400 mt-2 font-medium max-w-md">The system is synced. All deployment nodes are currently reporting operational stability.</p>
            </div>
          </section>

          {/* 3. CORE INTERFACE - Grid Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

            {/* Left Column: Attendance & Stats (8/12) */}
            <div className="xl:col-span-8 space-y-8">

              {/* Integrated Attendance Widget */}
              <div className="bg-white rounded-[2.5rem] p-2 border border-gray-100 shadow-sm">
                <AttendanceClock userType={userType} />
              </div>

              {/* Responsive Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                  <div key={i} onClick={() => navigate(m.route)} className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-[#FFCC00] transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black mb-4 group-hover:bg-[#FFCC00] transition-colors">
                      {m.icon}
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.title}</p>
                    <h3 className="text-2xl font-black italic">{loading ? "..." : m.value}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Actions & Logs (4/12) */}
            <div className="xl:col-span-4 space-y-6">

              {/* Quick Action Panel */}
              <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-xl">
                <h3 className="font-black text-lg mb-6 uppercase tracking-tight text-[#FFCC00]">Operational Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => navigate("/employees/create")} className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FFCC00] text-black font-black text-[10px] tracking-widest hover:scale-[1.02] transition-transform">
                    <span>INITIALIZE NEW AGENT</span> <FaPlus />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 text-white font-bold text-[10px] tracking-widest hover:bg-white/20 transition-colors">
                    <span>GENERATE REPORT</span> <FaArrowRight />
                  </button>
                </div>
              </div>

              <LiveLogs />
            </div>
          </div>
        </main>

        {/* 4. COMPACT FOOTER */}
        <footer className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            © 2026 Onafriq Ops Center • <span className="text-black">Making borders matter less.</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase text-gray-400 hidden sm:block">Terminal {currentTime.toLocaleTimeString()}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}