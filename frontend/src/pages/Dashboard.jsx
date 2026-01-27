import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FaUsers, FaChartLine, FaPlus, FaArrowRight } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { listEmployees } from "../services/employee";
import LiveLogs from "../components/LiveLogs";
import AttendanceWidget from "./Attendance";



export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Admin";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [counts, setCounts] = useState({ employees: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await listEmployees({ page: 1 });
        setCounts({ employees: res.data.count || 0 });
      } catch (err) { console.error(err); }
    };
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen font-sans text-black">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar title="Onafriq Ops Center" user={user} />

        <main className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content: Hero & Performance (Left 8 columns) */}
          <div className="lg:col-span-8 space-y-8">

            <section className="bg-black p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                      System <span className="text-[#FFCC00]">Live</span>
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Ops Terminal active for {user}.</p>
                  </div>
                  <div className="text-right border-l-4 border-[#FFCC00] pl-6">
                    <p className="text-3xl font-black tracking-tight">{currentTime.toLocaleTimeString([], { hour12: false })}</p>
                    <p className="text-[10px] font-bold text-[#FFCC00] uppercase tracking-[0.3em]">{currentTime.toLocaleDateString()}</p>
                  </div>
               </div>
            </section>

            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 h-96 flex flex-col justify-between">
               <h3 className="font-black text-xl uppercase tracking-tight">Workforce Performance</h3>
               <div className="flex-1 flex items-center justify-center">
                  <FaChartLine size={60} className="text-gray-100" />
               </div>
            </div>
          </div>

          {/* Sidebar: Controls & Logs (Right 4 columns) */}
          <div className="lg:col-span-4 space-y-6">

            <AttendanceWidget />

            <div className="bg-black text-white rounded-[2rem] p-8 shadow-xl">
              <h3 className="font-black text-lg mb-6 uppercase tracking-tight text-[#FFCC00]">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate("/employees/create")} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#FFCC00] text-black font-black text-[10px] tracking-widest hover:scale-95 transition-transform">
                  <span>ADD PERSONNEL</span>
                  <FaPlus />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 font-bold text-[10px] tracking-widest hover:bg-white/20">
                  <span>SYSTEM REPORT</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>

            <LiveLogs />

          </div>
        </main>
      </div>
    </div>
  );
}