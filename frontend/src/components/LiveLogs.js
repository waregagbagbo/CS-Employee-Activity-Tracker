import React, { useState, useEffect } from "react";
import { listAttendance } from "../services/attendance";
import { FaUserCircle, FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      // Fetching the latest 5 records
      const res = await listAttendance({ ordering: "-clock_in_time", limit: 5 });
      const data = res.data.results || res.data;
      setLogs(data.slice(0, 5));
    } catch (err) {
      console.error("LOG_SYNC_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
  </div>;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
      <h3 className="font-black text-lg mb-8 uppercase tracking-tight flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FFCC00] rounded-full animate-ping"></span>
          Terminal Logs
        </div>
        <span className="text-[9px] text-gray-400 tracking-[0.3em]">LIVE_FEED</span>
      </h3>

      <div className="space-y-6">
        {logs.length > 0 ? logs.map((log) => {
          const isClockOut = !!log.clock_out_time;
          const time = isClockOut
            ? new Date(log.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(log.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={log.id} className="flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${isClockOut ? 'bg-gray-100 text-gray-400' : 'bg-black text-[#FFCC00]'}`}>
                  {isClockOut ? <FaArrowDown size={12} /> : <FaArrowUp size={12} />}
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight italic">
                    {log.user?.username|| "Anonymous Operator"}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {isClockOut ? "Shift Terminated" : "Shift Initialized"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg tabular-nums">
                {time}
              </span>
            </div>
          );
        }) : (
          <p className="text-center text-gray-400 text-xs italic py-4">NO RECENT ACTIVITY DETECTED.</p>
        )}
      </div>
    </div>
  );
}