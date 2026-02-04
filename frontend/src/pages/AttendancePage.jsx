import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, LogIn, LogOut, Timer, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import AttendanceService from '../services/attendance';

const AttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedInDuration, setClockedInDuration] = useState(0);
  const [userType, setUserType] = useState('Employee');
  const [error, setError] = useState(null);

  const user = localStorage.getItem("username") || "Agent";

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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, summary] = await Promise.all([
        AttendanceService.getStatus(),
        AttendanceService.getTodaySummary()
      ]);
      setAttendanceStatus(status);
      setTodaySummary(summary);
      if (status.user_type) setUserType(status.user_type);
    } catch (err) {
      setError('Terminal Sync Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => {
    if (activeTab === 'history') fetchAttendanceHistory();
    if (activeTab === 'team') fetchTeamAttendance();
  }, [activeTab]);

  const fetchAttendanceHistory = async () => {
    const data = await AttendanceService.getPersonalHistory();
    setAttendanceHistory(data.attendances || []);
  };

  const fetchTeamAttendance = async (date = null) => {
    const data = await AttendanceService.getTeamAttendance(date);
    setTeamAttendance(data.attendances || []);
  };

  const handleClockAction = async () => {
    try {
      if (attendanceStatus?.is_clocked_in) {
        await AttendanceService.clockOut();
      } else {
        await AttendanceService.clockIn();
      }
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.detail || "Action Failed");
    }
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const formatDuration = (hours) => {
    if (!hours || hours < 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar /><div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse">Establishing Link...</div>
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

            <button
              onClick={handleClockAction}
              className={`group relative overflow-hidden px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                attendanceStatus?.is_clocked_in 
                ? "bg-rose-600 text-white hover:bg-rose-700" 
                : "bg-[#FFCC00] text-black hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3 relative z-10">
                {attendanceStatus?.is_clocked_in ? <><LogOut size={18}/> End Shift</> : <><LogIn size={18}/> Start Shift</>}
              </span>
            </button>
          </section>

          {/* STATUS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard
              icon={<Clock />}
              label="Session Timer"
              value={attendanceStatus?.is_clocked_in ? formatDuration(clockedInDuration) : 'In-Active'}
              detail={attendanceStatus?.is_clocked_in ? `Started at ${formatTime(attendanceStatus.clock_in_time)}` : 'Awaiting clock-in'}
              active={attendanceStatus?.is_clocked_in}
            />
            <StatusCard
              icon={<Calendar />}
              label="Assigned Shift"
              value={todaySummary?.shift?.shift_type || 'No Schedule'}
              detail={todaySummary?.shift ? `${formatTime(todaySummary.shift.scheduled_start)} - ${formatTime(todaySummary.shift.scheduled_end)}` : 'Standby Mode'}
            />
            <StatusCard
              icon={<TrendingUp />}
              label="Hours Accumulated"
              value={formatDuration(todaySummary?.total_hours_today || (attendanceStatus?.is_clocked_in ? clockedInDuration : 0))}
              detail="Total for current date"
              highlight
            />
          </div>

          {/* TAB SYSTEM */}
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-gray-200/50 w-fit rounded-2xl">
              {['today', 'history', 'team'].map(tab => (
                (tab !== 'team' || ['Supervisor', 'Manager', 'Admin'].includes(userType)) && (
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
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              {activeTab === 'today' && <TodayTab summary={todaySummary} formatTime={formatTime} formatDuration={formatDuration} />}
              {activeTab === 'history' && <HistoryTab history={attendanceHistory} formatDuration={formatDuration} formatTime={formatTime} />}
              {activeTab === 'team' && <TeamTab teamData={teamAttendance} onDateChange={fetchTeamAttendance} formatTime={formatTime} formatDuration={formatDuration} />}
            </div>
          </div>
        </main>

        <footer className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2026 Onafriq Operations</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest">System Operational</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

/* UI COMPONENTS */

const StatusCard = ({ icon, label, value, detail, active, highlight }) => (
  <div className={`${highlight ? 'bg-[#FFCC00] border-[#FFCC00]' : 'bg-white border-gray-100'} p-6 rounded-3xl border shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${highlight ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>{icon}</div>
      {active !== undefined && (
        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {active ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
    <p className={`text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-black/60' : 'text-gray-400'}`}>{label}</p>
    <h3 className="text-2xl font-black italic mt-1 uppercase truncate">{value}</h3>
    <p className={`text-[10px] mt-1 font-medium ${highlight ? 'text-black/70' : 'text-gray-500'}`}>{detail}</p>
  </div>
);

const TodayTab = ({ summary, formatTime, formatDuration }) => (
  <div className="p-8">
    <h3 className="text-xl font-black italic uppercase mb-6 tracking-tighter">Daily Activity</h3>
    <div className="space-y-4">
      {summary?.attendances?.length > 0 ? summary.attendances.map((log) => (
        <div key={log.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-black transition-colors">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase">Clock In</p>
              <p className="font-bold text-sm">{formatTime(log.clock_in_time)}</p>
            </div>
            <ChevronRight className="text-gray-300" />
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase">Clock Out</p>
              <p className="font-bold text-sm">{log.clock_out_time ? formatTime(log.clock_out_time) : '---'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-gray-400 uppercase">Session Total</p>
            <p className="font-black italic text-[#FFCC00] bg-black px-4 py-1 rounded-lg text-xs mt-1">{formatDuration(log.duration_hours)}</p>
          </div>
        </div>
      )) : <div className="text-center py-10 text-gray-400 font-bold uppercase text-xs tracking-widest">No activity recorded for today</div>}
    </div>
  </div>
);

const HistoryTab = ({ history, formatDuration, formatTime }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
          {['Date', 'Shift Type', 'Clock In', 'Clock Out', 'Duration'].map(h => (
            <th key={h} className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {history.map(row => (
          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="p-6 font-bold text-xs">{row.date}</td>
            <td className="p-6 text-[10px] text-gray-500 uppercase font-black">{row.shift_type || 'Unscheduled'}</td>
            <td className="p-6 text-xs font-mono">{formatTime(row.clock_in_time)}</td>
            <td className="p-6 text-xs font-mono">{formatTime(row.clock_out_time)}</td>
            <td className="p-6 font-black italic text-sm text-black">{formatDuration(row.duration_hours)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TeamTab = ({ teamData, onDateChange, formatTime, formatDuration }) => (
  <div className="p-8">
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <h3 className="text-xl font-black italic uppercase tracking-tighter text-black">Team Status</h3>
      <input
        type="date"
        onChange={(e) => onDateChange(e.target.value)}
        className="bg-gray-100 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase focus:ring-2 focus:ring-[#FFCC00]"
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teamData.map(member => (
        <div key={member.id} className="border border-gray-100 p-5 rounded-3xl flex justify-between items-center hover:shadow-md transition-shadow bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-[#FFCC00] rounded-full flex items-center justify-center font-black text-xs uppercase">
              {member.employee_name.charAt(0)}
            </div>
            <div>
              <p className="font-black text-sm uppercase italic leading-none">{member.employee_name}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                {formatTime(member.clock_in_time)} — {member.clock_out_time ? formatTime(member.clock_out_time) : 'ONLINE'}
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${member.status === 'clocked_in' ? 'bg-green-500 animate-pulse' : 'bg-gray-200'}`}></div>
        </div>
      ))}
    </div>
  </div>
);

export default AttendanceDashboard;