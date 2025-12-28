import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaUsers, FaFileAlt, FaCalendarCheck, FaChartLine,
  FaClock, FaPlus, FaArrowRight, FaCalendarAlt, FaPowerOff
} from "react-icons/fa";
import { FaPeopleGroup, FaBolt } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { listEmployees } from "../services/employee";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Admin";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [counts, setCounts] = useState({ employees: 0, depts: 0, shifts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await listEmployees({ page: 1 });
        const total = res.data.count || 0;
        setCounts({ employees: total, depts: total, shifts: total });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    { title: "Total Employees", value: counts.employees, icon: <FaUsers />, route: "/employees", color: "bg-black", iconColor: "text-[#FFCC00]" },
    { title: "Active Shifts", value: counts.shifts, icon: <FaCalendarCheck />, route: "/shifts", color: "bg-black", iconColor: "text-[#FFCC00]" },
    { title: "Departments", value: counts.depts, icon: <FaPeopleGroup />, route: "/departments", color: "bg-[#FFCC00]", iconColor: "text-black" },
    { title: "Avg Attendance", value: "95%", icon: <FaChartLine />, route: "/attendance", color: "bg-black", iconColor: "text-[#FFCC00]" },
    { title: "Pending Reports", value: "12", icon: <FaFileAlt />, route: "/reports", color: "bg-gray-100", iconColor: "text-black" },
  ];

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen font-sans text-black">
      {/* Sidebar would be black with yellow icons */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar title="Onafriq Ops Center" user={user} />

        <main className="p-6 lg:p-10 space-y-8">

          {/* High-Contrast Hero Section */}
          <section className="bg-black p-10 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tighter italic uppercase">
                  System <span className="text-[#FFCC00]">Active</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg font-medium">Welcome back, {user}. Operations are running smoothly.</p>
              </div>
              <div className="mt-6 md:mt-0 border-l-4 border-[#FFCC00] pl-6 py-2">
                <p className="text-3xl font-black tracking-tight">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
                <p className="text-xs font-bold text-[#FFCC00] uppercase tracking-widest mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            {/* Architectural accent */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#FFCC00] opacity-10 rounded-tl-full"></div>
          </section>

          {/* Key Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {modules.map((mod, i) => (
              <div
                key={i}
                onClick={() => navigate(mod.route)}
                className="group cursor-pointer bg-white p-6 rounded-2xl border-b-4 border-transparent hover:border-[#FFCC00] shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`${mod.color} ${mod.iconColor} w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:rotate-12`}>
                  {mod.icon}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{mod.title}</p>
                <h3 className="text-3xl font-black mt-1 tracking-tight">{loading ? "..." : mod.value}</h3>
              </div>
            ))}
          </section>

          {/* Activity & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-xl uppercase tracking-tight">Workforce Performance</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFCC00]"></div>
                  </div>
                </div>
                <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                   <FaChartLine size={40} className="text-gray-200" />
                </div>
              </div>
            </div>

            {/* Sidebar Actions Area */}
            <div className="space-y-6">
              <div className="bg-black text-white rounded-[2rem] p-8 shadow-xl">
                <h3 className="font-black text-xl mb-6 uppercase tracking-tight text-[#FFCC00]">Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#FFCC00] text-black font-black hover:scale-[1.02] transition-transform">
                    <span>ADD EMPLOYEE</span>
                    <FaPlus />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
                    <span>LOG REPORT</span>
                    <FaArrowRight />
                  </button>
                </div>
              </div>

              {/* Real-time Status */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                <h3 className="font-black text-lg mb-6 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FFCC00] rounded-full animate-ping"></span>
                  Live Logs
                </h3>
                <div className="space-y-6">
                  {[
                    { name: "K. Mensah", task: "Clocked In", time: "09:00" },
                    { name: "L. Diop", task: "Shift Ended", time: "17:30" },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-4">
                      <div>
                        <p className="font-bold text-sm">{log.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{log.task}</p>
                      </div>
                      <span className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded tracking-tighter">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}