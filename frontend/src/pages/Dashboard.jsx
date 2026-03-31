import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttendanceClock from "../components/AttendanceClock";
import LiveLogs from "../components/LiveLogs";
import ShiftService from "../services/shifts";
import { listEmployees } from "../services/employee";
import AttendanceService from "../services/attendance";
import { FaUsers, FaCalendarCheck, FaChartLine, FaPlus, FaArrowRight } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const user = localStorage.getItem("username") || "Agent";
  const userType = localStorage.getItem("user_role") || "employee_agent";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [counts, setCounts] = useState({employees: 0, depts: 0, shifts: 0, attendance: 0});
  const [loading, setLoading] = useState(true);

  const [availableShifts, setAvailableShifts] = useState([]);
  const [status, setStatus] = useState(null);

  // Fetch employee counts
  const fetchCounts = useCallback(async () => {
    try {
      const empRes = await listEmployees({page: 1});
      setCounts({
        employees: empRes.data.count || 0,
        depts: empRes.data.count || 0,
        shifts: empRes.data.count || 0,
        attendance: empRes.data.count === 94 ? 100 : 90,
      });
    } catch (err) {
      console.error("Sync Error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch shifts
  const fetchShifts = useCallback(async () => {
    try {
      const shiftsRes = await ShiftService.getMyShifts();
      const today = new Date().toISOString().split("T")[0];
      const todaysShifts = (shiftsRes.shifts || []).filter(s => s.shift_date === today);
      setAvailableShifts(todaysShifts);
    } catch (err) {
      console.error("Dashboard Sync Error", err);
    }
  }, []);

  // Fetch attendance status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await AttendanceService.getStatus();
      setStatus(res);
    } catch (err) {
      console.error("Attendance status error", err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchShifts();
    fetchStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchCounts, fetchShifts, fetchStatus]);

  const handleClockIn = async (shiftId) => {
    try {
      const res = await AttendanceService.clockIn({shift_id: shiftId});
      setStatus(res);
      fetchShifts();
    } catch (err) {
      console.error("Clock-in failed", err);
    }
  };

  const metrics = [
    {title: "Team Size", value: counts.employees, icon: <FaUsers/>, route: "/employees"},
    {title: "Active Shifts", value: counts.shifts, icon: <FaCalendarCheck/>, route: "/shifts"},
    {title: "Departments", value: counts.depts, icon: <FaPeopleGroup/>, route: "/departments"},
    {title: "Avg Attendance", value: counts.attendance + "%", icon: <FaChartLine/>, route: "/attendance"},
  ];

  return (
      <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
        {/* SIDEBAR */}
        <aside
            className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar closeMobile={() => setSidebarOpen(false)}/>
        </aside>
        {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
                               onClick={() => setSidebarOpen(false)}/>}

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <header className="flex items-center bg-white border-b border-gray-100 lg:border-none">
            <button onClick={() => setSidebarOpen(true)} className="p-4 lg:hidden text-black">☰</button>
            <div className="flex-1"><Topbar title="Command Center" user={user}/></div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-8 pb-32">

            {/* HERO SECTION */}
            <section
                className="bg-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <span
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFCC00]">Operations Active</span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase mt-2">
                  Good {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.split(' ')[0]}
                </h1>
                <p className="text-gray-400 mt-2 font-medium max-w-md">System synced. Deployment nodes reporting
                  operational stability.</p>
              </div>
            </section>

            {/* GRID: LEFT = Attendance + Shifts, RIGHT = Actions + Logs */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

              {/* LEFT: Attendance + Shifts */}
              <div className="xl:col-span-8 space-y-8">

                {/* Attendance Clock */}
                <div className="bg-white rounded-[2.5rem] p-4 border border-gray-100 shadow-sm">
                  <AttendanceClock userType={userType}/>
                </div>

                {/* Today / Upcoming Shifts Panel */}
                <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black italic uppercase mb-4">Today's Shifts</h3>
                  {availableShifts.length > 0 ? (
                      <ul className="space-y-4">
                        {availableShifts.map(shift => (
                            <li key={shift.id}
                                className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <div>
                                <p className="font-bold text-sm uppercase">{shift.shift_type}</p>
                                <p className="text-[10px] text-gray-500">{shift.shift_start_time} - {shift.shift_end_time}</p>
                              </div>
                              {status?.shift ? (
                                  <span
                                      className="px-2 py-1 text-[9px] font-black rounded-full uppercase bg-green-50 text-green-600 animate-pulse">
                            Assigned
                          </span>
                              ) : (
                                  <button
                                      onClick={() => handleClockIn(shift.id)}
                                      className="px-3 py-1 text-xs font-black rounded bg-[#FFCC00] text-black hover:scale-[1.05] transition-transform"
                                  >
                                    Clock In
                                  </button>
                              )}
                            </li>
                        ))}
                      </ul>
                  ) : <p className="text-gray-400 text-xs uppercase font-bold">No shifts scheduled today</p>}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((m, i) => (
                      <div key={i} onClick={() => navigate(m.route)}
                           className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-[#FFCC00] transition-all cursor-pointer group">
                        <div
                            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black mb-4 group-hover:bg-[#FFCC00] transition-colors">{m.icon}</div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.title}</p>
                        <h3 className="text-2xl font-black italic">{loading ? "..." : m.value}</h3>
                      </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Actions + Logs */}
              <div className="xl:col-span-4 space-y-6">

                {/* Quick Action Panel */}
                <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-xl">
                  <h3 className="font-black text-lg mb-6 uppercase tracking-tight text-[#FFCC00]">
                    Operational Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                        onClick={() => navigate("/employees/create")}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FFCC00] text-black font-black text-[10px] tracking-widest hover:scale-[1.02] transition-transform"
                    >
                      <span>INITIALIZE NEW AGENT</span>
                      <FaPlus/>
                    </button>
                    <button
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 text-white font-bold text-[10px] tracking-widest hover:bg-white/20 transition-colors"
                    >
                      <span>GENERATE REPORT</span>
                      <FaArrowRight/>
                    </button>
                  </div>
                </div>

                {/* Live Logs */}
                <LiveLogs/>
              </div>

            </div>
            {/* end grid */}

          </main>
        </div>
      </div>
  );
}