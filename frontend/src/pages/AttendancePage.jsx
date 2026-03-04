import React, { useState, useEffect, useCallback } from "react";
import { Clock, Calendar, TrendingUp, LogIn, LogOut, ChevronRight } from "lucide-react";
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

  // Timer for session duration
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

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, summary, shifts] = await Promise.all([
        AttendanceService.getStatus(),
        AttendanceService.getTodaySummary(),
        ShiftService.getMyShifts(),
      ]);

      setAttendanceStatus(status);
      setTodaySummary(summary);

      const today = new Date().toISOString().split("T")[0];
      const todayShifts = (shifts || []).filter((s) => s.shift_date === today);
      setAvailableShifts(todayShifts);

      if (todayShifts.length === 1) setSelectedShift(todayShifts[0].id);
      if (status.user_type) setUserType(status.user_type);
    } catch (err) {
      setError("Terminal Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => {
    if (activeTab === "history") fetchAttendanceHistory();
    if (activeTab === "team") fetchTeamAttendance();
  }, [activeTab]);

  const fetchAttendanceHistory = async () => {
    const data = await AttendanceService.getPersonalHistory();
    setAttendanceHistory(data.attendance || []);
  };

  const fetchTeamAttendance = async (date = null) => {
    const data = await AttendanceService.getTeamAttendance(date);
    setTeamAttendance(data.attendance || []);
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

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
  const formatDuration = (hours) => {
    if (!hours || hours < 0) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse">
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
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">Deployment Terminal</h1>
              <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">
                {currentTime.toDateString()} // {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* SHIFT DROPDOWN */}
            {!attendanceStatus?.is_clocked_in && availableShifts.length > 0 && (
              <select
                value={selectedShift || ""}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="bg-[#FFCC00] text-black font-bold px-4 py-2 rounded-xl uppercase tracking-widest"
              >
                <option value="">Select Shift</option>
                {availableShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shift_type} ({formatTime(s.shift_start_time)} - {formatTime(s.shift_end_time)})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleClockAction}
              className={`group relative overflow-hidden px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                attendanceStatus?.is_clocked_in
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-[#FFCC00] text-black hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3 relative z-10">
                {attendanceStatus?.is_clocked_in ? (<><LogOut size={18} /> End Shift</>) : (<><LogIn size={18} /> Start Shift</>)}
              </span>
            </button>
          </section>

          {/* STATUS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard
              icon={<Clock />}
              label="Session Timer"
              value={attendanceStatus?.is_clocked_in ? formatDuration(clockedInDuration) : "In-Active"}
              detail={attendanceStatus?.is_clocked_in ? `Started at ${formatTime(attendanceStatus.clock_in_time)}` : "Awaiting clock-in"}
              active={attendanceStatus?.is_clocked_in}
            />
            <StatusCard
              icon={<Calendar />}
              label="Assigned Shift"
              value={todaySummary?.shift?.shift_type || "No Schedule"}
              detail={todaySummary?.shift ? `${formatTime(todaySummary.shift.shift_start_time)} - ${formatTime(todaySummary.shift.shift_end_time)}` : "Standby Mode"}
            />
            <StatusCard
              icon={<TrendingUp />}
              label="Hours Accumulated"
              value={formatDuration(todaySummary?.total_hours_today || (attendanceStatus?.is_clocked_in ? clockedInDuration : 0))}
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

// Status Card
const StatusCard = ({ icon, label, value, detail, active, highlight }) => (
  <div className={`${highlight ? "bg-[#FFCC00] border-[#FFCC00]" : "bg-white border-gray-100"} p-6 rounded-3xl border shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${highlight ? "bg-black text-white" : "bg-gray-50 text-black"}`}>{icon}</div>
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

// Tab Section
const TabSection = ({ activeTab, setActiveTab, userType, todaySummary, attendanceHistory, teamAttendance, fetchTeamAttendance, formatTime, formatDuration }) => (
  <>
    <div className="flex gap-2 p-1 bg-gray-200/50 w-fit rounded-2xl">
      {["today", "history", "team"].map(
        (tab) =>
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
      {activeTab === "today" && <TodayTab summary={todaySummary} formatTime={formatTime} formatDuration={formatDuration} />}
      {activeTab === "history" && <HistoryTab history={attendanceHistory} formatDuration={formatDuration} formatTime={formatTime} />}
      {activeTab === "team" && <TeamTab teamData={teamAttendance} onDateChange={fetchTeamAttendance} formatTime={formatTime} formatDuration={formatDuration} />}
    </div>
  </>
);

// Today Tab
const TodayTab = ({ summary, formatTime, formatDuration }) => (
  <div className="p-6 space-y-4">
    <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Today's Overview</h3>
    <p>Shift: {summary?.shift?.shift_type || "No Schedule"}</p>
    <p>Start: {formatTime(summary?.shift?.shift_start_time)}</p>
    <p>End: {formatTime(summary?.shift?.shift_end_time)}</p>
    <p>Total Hours Today: {formatDuration(summary?.total_hours_today)}</p>
  </div>
);

// History Tab
const HistoryTab = ({ history, formatTime, formatDuration }) => (
  <div className="p-6 space-y-4">
    <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Personal Attendance History</h3>
    {history.length === 0 && <p className="text-gray-400 italic text-xs">No past records found</p>}
    {history.map((rec, idx) => (
      <div key={idx} className="p-3 border rounded-xl flex justify-between text-xs">
        <span>{new Date(rec.date).toDateString()}</span>
        <span>{formatTime(rec.clock_in)} - {formatTime(rec.clock_out)}</span>
        <span>{formatDuration(rec.total_hours)}</span>
      </div>
    ))}
  </div>
);

// Team Tab
const TeamTab = ({ teamData, onDateChange, formatTime, formatDuration }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    onDateChange(e.target.value);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 items-center">
        <h3 className="font-black uppercase tracking-widest text-sm text-gray-400">Team Attendance</h3>
        <input type="date" value={selectedDate} onChange={handleDateChange} className="border p-2 rounded-xl text-xs"/>
      </div>
      {teamData.length === 0 && <p className="text-gray-400 italic text-xs">No records found</p>}
      {teamData.map((rec, idx) => (
        <div key={idx} className="p-3 border rounded-xl flex justify-between text-xs">
          <span>{rec.employee_name}</span>
          <span>{formatTime(rec.clock_in)} - {formatTime(rec.clock_out)}</span>
          <span>{formatDuration(rec.total_hours)}</span>
        </div>
      ))}
    </div>
  );
};

export default AttendanceDashboard;