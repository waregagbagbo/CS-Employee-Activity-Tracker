import React, { useState, useEffect, useCallback } from "react";
import { Clock, Calendar, TrendingUp, LogIn, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttendanceService from "../services/attendance";
import ShiftService from "../services/shifts";

const AttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedInDuration, setClockedInDuration] = useState(0);
  const [userType, setUserType] = useState("Employee");
  const [availableShifts, setAvailableShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [error, setError] = useState(null);

  const user = localStorage.getItem("username") || "Agent";

  // --- Live session timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (attendanceStatus?.is_clocked_in && attendanceStatus?.clock_in_time) {
        const start = new Date(attendanceStatus.clock_in_time);
        const duration = (new Date() - start) / 1000 / 60 / 60;
        setClockedInDuration(duration);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [attendanceStatus]);

  // --- Fetch initial data ---
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, summary, shiftsResponse] = await Promise.all([
        AttendanceService.getStatus(),
        AttendanceService.getTodaySummary(),
        ShiftService.getMyShifts(),
      ]);

      setAttendanceStatus(status);
      setTodaySummary(summary);

      // FIX 1: unwrap paginated response { count, results: [...] }
      const allShifts = shiftsResponse?.results || [];
      const today = new Date().toISOString().split("T")[0];
      const todayShifts = allShifts.filter((s) => s.shift_date === today);
      setAvailableShifts(todayShifts);

      if (todayShifts.length === 1) setSelectedShift(todayShifts[0].id);
      if (status.user_type) setUserType(status.user_type);

    } catch (err) {
      console.error(err);
      setError("Terminal Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (activeTab === "history") fetchAttendanceHistory();
    if (activeTab === "team") fetchTeamAttendance();
  }, [activeTab]);

  const fetchAttendanceHistory = async () => {
    try {
      const data = await AttendanceService.getPersonalHistory();
      setAttendanceHistory(data.attendance || data.results || []);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  };

  const fetchTeamAttendance = async (date = null) => {
    try {
      const data = await AttendanceService.getTeamAttendance(date);
      setTeamAttendance(data.attendance || data.results || []);
    } catch (err) {
      console.error("Team attendance fetch failed:", err);
    }
  };

  const handleClockAction = async () => {
    try {
      if (attendanceStatus?.is_clocked_in) {
        await AttendanceService.clockOut();
      } else {
        if (!selectedShift) return alert("Please select a shift before clocking in.");
        await AttendanceService.clockIn({ shift_id: selectedShift });
      }
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.detail || "Action Failed");
    }
  };

  // FIX 2: handles both "HH:MM:SS" time strings and full ISO datetimes
  const formatTime = (ts) => {
    if (!ts) return "-";
    const normalized = ts.includes("T") ? ts : `2000-01-01T${ts}`;
    return new Date(normalized).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (hours) => {
    if (!hours || hours < 0) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400">
        Establishing Link...
      </div>
    </div>
  );

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Attendance Log" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-32">

          {/* ACTION HEADER */}
          <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col lg:flex-row justify-between items-center gap-6 border-b-4 border-[#FFCC00]">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">
                Deployment Terminal
              </h1>
              <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">
                {currentTime.toDateString()} // {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* SHIFT DROPDOWN — shown only when not clocked in and shifts exist */}
            {!attendanceStatus?.is_clocked_in && availableShifts.length > 0 && (
              <select
                value={selectedShift || ""}
                onChange={(e) => setSelectedShift(Number(e.target.value))}
                className="bg-[#1a1a1a] text-[#FFCC00] border border-[#FFCC00]/30 font-bold px-5 py-3 rounded-xl uppercase tracking-widest text-xs w-full lg:w-auto"
              >
                <option value="">— Select Shift —</option>
                {availableShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shift_type?.replace(/_/g, " ")} &nbsp;
                    {formatTime(s.shift_start_time)} – {formatTime(s.shift_end_time)}
                  </option>
                ))}
              </select>
            )}

            {/* No shifts message */}
            {!attendanceStatus?.is_clocked_in && availableShifts.length === 0 && (
              <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                No shifts assigned today
              </p>
            )}

            <button
              onClick={handleClockAction}
              className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 ${
                attendanceStatus?.is_clocked_in
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-[#FFCC00] text-black hover:bg-white"
              }`}
            >
              {attendanceStatus?.is_clocked_in
                ? (<><LogOut size={18} /> End Shift</>)
                : (<><LogIn size={18} /> Start Shift</>)
              }
            </button>
          </section>

          {/* ERROR BANNER */}
          {error && (
            <div className="bg-rose-50 text-rose-500 font-black uppercase text-xs tracking-widest p-4 rounded-2xl text-center">
              {error}
            </div>
          )}

          {/* STATUS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard
              icon={<Clock />}
              label="Session Timer"
              value={attendanceStatus?.is_clocked_in ? formatDuration(clockedInDuration) : "In-Active"}
              detail={
                attendanceStatus?.is_clocked_in
                  ? `Started at ${formatTime(attendanceStatus.clock_in_time)}`
                  : "Awaiting clock-in"
              }
              active={attendanceStatus?.is_clocked_in}
            />
            <StatusCard
              icon={<Calendar />}
              label="Assigned Shift"
              value={
                todaySummary?.shift?.shift_attendance_type?.replace(/_/g, " ") ||
                todaySummary?.shift?.shift_type?.replace(/_/g, " ") ||
                "No Schedule"
              }
              detail={
                todaySummary?.shift
                  ? `${formatTime(todaySummary.shift.scheduled_start || todaySummary.shift.shift_start_time)} – ${formatTime(todaySummary.shift.scheduled_end || todaySummary.shift.shift_end_time)}`
                  : "Standby Mode"
              }
            />
            <StatusCard
              icon={<TrendingUp />}
              label="Hours Accumulated"
              value={formatDuration(
                todaySummary?.total_hours_today ||
                (attendanceStatus?.is_clocked_in ? clockedInDuration : 0)
              )}
              detail="Total for current date"
              highlight
            />
          </div>

          {/* TABS */}
          <TabSection
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userType={userType}
            todaySummary={todaySummary}
            attendanceHistory={attendanceHistory}
            teamAttendance={teamAttendance}
            fetchTeamAttendance={fetchTeamAttendance}
            formatTime={formatTime}
            formatDuration={formatDuration}
          />

        </main>
      </div>
    </div>
  );
};

/* ====== INLINE COMPONENTS ====== */

const StatusCard = ({ icon, label, value, detail, active, highlight }) => (
  <div className={`${highlight ? "bg-[#FFCC00] border-[#FFCC00]" : "bg-white border-gray-100"} p-6 rounded-3xl border shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${highlight ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        {icon}
      </div>
      {active !== undefined && (
        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
          {active ? "Online" : "Offline"}
        </span>
      )}
    </div>
    <p className={`text-[9px] font-black uppercase tracking-widest ${highlight ? "text-black/60" : "text-gray-400"}`}>{label}</p>
    <h3 className="text-2xl font-black italic mt-1 uppercase truncate">{value}</h3>
    <p className={`text-[10px] mt-1 font-medium ${highlight ? "text-black/70" : "text-gray-500"}`}>{detail}</p>
  </div>
);

const TabSection = ({ activeTab, setActiveTab, userType, todaySummary, attendanceHistory, teamAttendance, fetchTeamAttendance, formatTime, formatDuration }) => (
  <>
    <div className="flex gap-2 p-1 bg-gray-200/50 w-fit rounded-2xl">
      {["today", "history", "team"].map((tab) =>
        (tab !== "team" || ["Supervisor", "Manager", "Admin"].includes(userType)) && (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? "bg-black text-[#FFCC00] shadow-lg" : "text-gray-500 hover:text-black"
            }`}
          >
            {tab}
          </button>
        )
      )}
    </div>

    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mt-4">
      {activeTab === "today" && (
        <TodayTab summary={todaySummary} formatTime={formatTime} formatDuration={formatDuration} />
      )}
      {activeTab === "history" && (
        <HistoryTab history={attendanceHistory} formatTime={formatTime} formatDuration={formatDuration} />
      )}
      {activeTab === "team" && (
        <TeamTab teamData={teamAttendance} onDateChange={fetchTeamAttendance} formatTime={formatTime} formatDuration={formatDuration} />
      )}
    </div>
  </>
);

const TodayTab = ({ summary, formatTime, formatDuration }) => (
  <div className="p-8 space-y-6">
    <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Today's Overview</h3>

    {summary?.shift ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Shift Type</p>
          <p className="font-black uppercase italic">
            {(summary.shift.shift_attendance_type || summary.shift.shift_type)?.replace(/_/g, " ")}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Schedule</p>
          <p className="font-black font-mono">
            {formatTime(summary.shift.scheduled_start || summary.shift.shift_start_time)}
            {" – "}
            {formatTime(summary.shift.scheduled_end || summary.shift.shift_end_time)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
          <p className="font-black uppercase italic">
            {summary.shift.status?.replace(/_/g, " ") || "—"}
          </p>
        </div>
        <div className="bg-[#FFCC00] p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/60 mb-1">Hours Today</p>
          <p className="font-black text-2xl italic">{formatDuration(summary.total_hours_today)}</p>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 text-gray-400">
        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-black uppercase tracking-widest text-sm">No Shift Scheduled Today</p>
        <p className="text-xs mt-1">Standby mode active</p>
      </div>
    )}

    {/* Clock entries */}
    {summary?.attendances?.length > 0 && (
      <div className="space-y-3">
        <h4 className="font-black uppercase tracking-widest text-xs text-gray-400">Clock Entries</h4>
        {summary.attendances.map((a, idx) => (
          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl text-xs font-bold">
            <span className="uppercase tracking-widest text-gray-500">{a.status?.replace(/_/g, " ")}</span>
            <span className="font-mono">
              {formatTime(a.clock_in_time)} – {a.clock_out_time ? formatTime(a.clock_out_time) : "Active"}
            </span>
            <span className="bg-black text-[#FFCC00] px-3 py-1 rounded-full text-[9px] font-black">
              {formatDuration(a.duration_hours)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const HistoryTab = ({ history, formatTime, formatDuration }) => (
  <div className="p-8 space-y-4">
    <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Personal Attendance History</h3>
    {history.length === 0 ? (
      <p className="text-gray-400 italic text-xs text-center py-10">No past records found</p>
    ) : (
      history.map((rec, idx) => (
        <div key={idx} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center text-xs hover:border-[#FFCC00] transition-all">
          <span className="font-black uppercase">
            {new Date(rec.date || rec.clock_in_time).toDateString()}
          </span>
          <span className="font-mono text-gray-500">
            {formatTime(rec.clock_in || rec.clock_in_time)} – {formatTime(rec.clock_out || rec.clock_out_time)}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-black text-[9px] uppercase">
            {formatDuration(rec.total_hours || rec.duration_hours)}
          </span>
        </div>
      ))
    )}
  </div>
);

const TeamTab = ({ teamData, onDateChange, formatTime, formatDuration }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    onDateChange(e.target.value);
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Team Attendance</h3>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border border-gray-200 p-2 rounded-xl text-xs font-bold"
        />
      </div>
      {teamData.length === 0 ? (
        <p className="text-gray-400 italic text-xs text-center py-10">No records found for this date</p>
      ) : (
        teamData.map((rec, idx) => (
          <div key={idx} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center text-xs hover:border-[#FFCC00] transition-all">
            <span className="font-black uppercase">{rec.employee_name || rec.employee}</span>
            <span className="font-mono text-gray-500">
              {formatTime(rec.clock_in || rec.clock_in_time)} – {formatTime(rec.clock_out || rec.clock_out_time)}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full font-black text-[9px] uppercase">
              {formatDuration(rec.total_hours || rec.duration_hours)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default AttendanceDashboard;