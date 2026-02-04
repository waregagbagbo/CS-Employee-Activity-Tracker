import React, { useState, useEffect } from "react";
import AttendanceService from "../services/attendance"; // Using our centralized service
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      /**
       * In DRF ModelViewSet, list() returns the queryset filtered by
       * the backend (Admin sees all, Supervisor sees team, Employee sees own).
       */
      const data = await AttendanceService.list();

      // Handle both paginated ({ results: [] }) and non-paginated arrays
      const records = data.results || data;

      // Take the 5 most recent activities
      setLogs(records.slice(0, 5));
    } catch (err) {
      console.error("LOG_SYNC_FAILURE", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 30 seconds for that "Live" feel
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse p-8">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-50 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full">
      <h3 className="font-black text-lg mb-8 uppercase tracking-tight flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FFCC00] rounded-full animate-ping"></span>
          Terminal Logs
        </div>
        <span className="text-[9px] text-gray-400 tracking-[0.3em]">LIVE_FEED</span>
      </h3>

      <div className="space-y-6">
        {logs.length > 0 ? logs.map((log) => {
          // Logic: If clock_out exists, the latest activity was a clock out.
          const isClockOut = log.status === 'clocked_out' || !!log.clock_out_time;

          const time = isClockOut
            ? new Date(log.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(log.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={log.id} className="flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  isClockOut 
                    ? 'bg-gray-50 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500' 
                    : 'bg-black text-[#FFCC00] group-hover:bg-[#FFCC00] group-hover:text-black'
                }`}>
                  {isClockOut ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight italic text-black">
                    {/* Accessing nested username based on your ViewSet's select_related */}
                    {log.employee_name || log.employee?.user?.username || "SYS_USER"}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                    {isClockOut ? "Deployment Terminated" : "Deployment Initialized"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg tabular-nums">
                  {time}
                </span>
                {log.duration_hours && isClockOut && (
                  <p className="text-[8px] font-black text-gray-300 mt-1 mr-1">{log.duration_hours}H</p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-10">
            <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No Recent Activity Detected</p>
          </div>
        )}
      </div>
    </div>
  );
}