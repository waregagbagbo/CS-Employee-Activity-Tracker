import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { AttendanceService } from "../services/attendance";
import AttendanceCard from "../components/AttendanceCard";
import AttendanceFeed from "../components/AttendanceFeed";

export default function AttendancePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "Agent";

  const loadAttendanceData = useCallback(async () => {
    try {
      const data = await AttendanceService.getHistory();
      setLogs(data);
    } catch (err) {
      console.error("Failed synchronizing log entries data pipeline arrays:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Scrape running logs to locate the existence of active active records (missing out punches)
  const activePunchRecord = logs.find(log => !log.clock_out_time);

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Attendance Tracking Terminal" user={username} />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 pb-24">

          {/* APP WINDOW SYSTEM CARD BAR */}
          <section className="bg-black p-6 rounded-[2.5rem] text-white flex justify-between items-center border-b-4 border-[#FFCC00]">
            <div className="flex items-center gap-3">
              <ShieldAlert size={22} className="text-[#FFCC00]" />
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Time & Attendance
              </h1>
            </div>
          </section>

          {/* CLOCK CONTROL CARD WRAPPER */}
          <AttendanceCard activeRecord={activePunchRecord} onStatusChange={loadAttendanceData} />

          {/* COMPREHENSIVE RUNNING HISTORY LIST LAYER VIEW */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-gray-100 pb-3">
              Historic Deployment Clock Entries
            </h3>

            {loading ? (
              <div className="text-center py-12 text-gray-400 font-black uppercase tracking-widest">
                Syncing audit records...
              </div>
            ) : (
              <AttendanceFeed items={logs} />
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
