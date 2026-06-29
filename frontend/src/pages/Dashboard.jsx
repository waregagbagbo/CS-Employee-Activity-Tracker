import React, { useEffect, useState, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttendanceService from "../services/attendance";
import ReportService from "../services/reports";
import ShiftService from "../services/shifts";
import {
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader,
  CheckCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ============================================
// SMALL HELPERS
// ============================================

function formatDuration(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0) return "0h 0m 0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function getGreeting(hour) {
  if (hour < 5) return "Still Up?";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Working Late";
}

/** Counts up to a target number on mount/update — adds a little life to flat stats. */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;
    let start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * safeTarget));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

/** Wraps a section with a staggered fade/slide-in entrance. */
function Reveal({ children, mounted, index = 0, className = "" }) {
  return (
    <div
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${index * 90}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Animated horizontal bar used in the supervisor "Performance Pulse" panel. */
function PulseBar({ label, value, max, colorClass }) {
  const [width, setWidth] = useState(0);
  const count = useCountUp(value);

  useEffect(() => {
    const t = setTimeout(() => setWidth(max > 0 ? (value / max) * 100 : 0), 150);
    return () => clearTimeout(t);
  }, [value, max]);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
        <span className="text-sm font-black text-gray-900">{count}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/** Skeleton shown while the dashboard's data is loading, shaped like the real layout. */
function DashboardSkeleton() {
  return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar title="Dashboard" user="" />
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-[2.5rem]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-[2.5rem]" />
              ))}
            </div>
            <div className="h-72 bg-gray-200 rounded-[2.5rem]" />
            <div className="flex items-center gap-2 justify-center text-gray-400 font-black uppercase text-xs tracking-widest pt-4">
              <Loader size={16} className="animate-spin" />
              Loading dashboard…
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Agent";
  const userType = localStorage.getItem("user_type") || "employee_agent";

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [pendingReports, setPendingReports] = useState(0);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [reportSearch, setReportSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  // Tick the clock every second — drives the live worked-hours counter below.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger entrance animation once data has actually rendered.
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setMounted(true), 30);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statusData = await AttendanceService.getTodaySummary();
      setTodayStatus(statusData);

      const reportsData = await ReportService.list({ ordering: "-activity_submitted_at" });
      const reports = reportsData.results || reportsData;
      setRecentReports(reports.slice(0, 5));

      if (userType === "supervisor") {
        const pendingData = await ReportService.getPendingApproval();
        const pending = pendingData.results || pendingData;
        setPendingReports(pending.length);

        const analyticsData = await ReportService.getAnalytics();
        setAnalytics(analyticsData);
      }

      const shiftsData = await ShiftService.getMyShifts();
      const shifts = shiftsData.results || shiftsData;
      setUpcomingShifts(shifts.slice(0, 3));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Live elapsed time since clock-in, ticking every second.
  const liveElapsedSeconds = useMemo(() => {
    if (!todayStatus?.is_clocked_in || !todayStatus?.clock_in_time) return null;
    return Math.floor((now.getTime() - new Date(todayStatus.clock_in_time).getTime()) / 1000);
  }, [now, todayStatus]);

  const pendingCount = useCountUp(recentReports.filter((r) => !r.is_approved).length);
  const reportsCount = useCountUp(recentReports.length);

  const visibleReports = useMemo(() => {
    let list = [...recentReports];
    if (reportSearch.trim()) {
      const q = reportSearch.trim().toLowerCase();
      list = list.filter((r) => (r.report_type || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const da = new Date(a.activity_submitted_at).getTime();
      const db = new Date(b.activity_submitted_at).getTime();
      return sortAsc ? da - db : db - da;
    });
    return list;
  }, [recentReports, reportSearch, sortAsc]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Dashboard" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* WELCOME HEADER */}
            <Reveal mounted={mounted} index={0}>
              <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white border-b-4 border-[#FFCC00] relative overflow-hidden">
                {/* subtle ambient glow, purely decorative */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FFCC00] opacity-10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[#FFCC00] mb-2">
                      {getGreeting(now.getHours())}
                    </h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em]">
                      {now.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {"  ·  "}
                      <span className="text-[#FFCC00]">{now.toLocaleTimeString()}</span>
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {userType !== "supervisor" && (
                      <button
                        onClick={() => navigate("/attendance")}
                        className="bg-[#FFCC00] text-black px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        Clock In/Out
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/reports")}
                      className="bg-gray-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-gray-600 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Reports
                    </button>
                  </div>
                </div>
              </section>
            </Reveal>

            {/* KEY METRICS - EMPLOYEE VIEW */}
            {userType !== "supervisor" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Clock Status */}
                <Reveal mounted={mounted} index={1}>
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                        Clock Status
                      </h3>
                      <Clock
                        size={20}
                        className={todayStatus?.is_clocked_in ? "text-[#FFCC00] animate-pulse" : "text-gray-300"}
                      />
                    </div>
                    {todayStatus?.is_clocked_in ? (
                      <>
                        <p className="text-4xl font-black text-emerald-600 mb-2 flex items-center gap-2">
                          CLOCKED IN
                          <span className="relative inline-flex w-2.5 h-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 font-bold font-mono">
                          {formatDuration(liveElapsedSeconds)} elapsed
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl font-black text-gray-400 mb-2">CLOCKED OUT</p>
                        <p className="text-xs text-gray-600 font-bold">
                          {todayStatus?.duration_hours
                            ? `Today: ${todayStatus.duration_hours}h`
                            : "Ready to clock in"}
                        </p>
                      </>
                    )}
                  </div>
                </Reveal>

                {/* Pending Reports */}
                <Reveal mounted={mounted} index={2}>
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                        My Reports
                      </h3>
                      <FileText size={20} className="text-blue-500" />
                    </div>
                    <p className="text-4xl font-black text-blue-600 mb-2 tabular-nums">{reportsCount}</p>
                    <p className="text-xs text-gray-600 font-bold">
                      {pendingCount} pending approval
                    </p>
                  </div>
                </Reveal>

                {/* Upcoming Shifts */}
                <Reveal mounted={mounted} index={3}>
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                        Next Shift
                      </h3>
                      <TrendingUp size={20} className="text-orange-500" />
                    </div>
                    {upcomingShifts.length > 0 ? (
                      <>
                        <p className="text-lg font-black text-orange-600 mb-2">
                          {upcomingShifts[0].shift_type?.replace(/_/g, " ") || "Scheduled"}
                        </p>
                        <p className="text-xs text-gray-600 font-bold">
                          {new Date(upcomingShifts[0].shift_date).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-black text-gray-400 mb-2">No Shifts</p>
                        <p className="text-xs text-gray-600 font-bold">Contact admin</p>
                      </>
                    )}
                  </div>
                </Reveal>
              </div>
            )}

            {/* KEY METRICS - SUPERVISOR VIEW */}
            {userType === "supervisor" && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Pending Approval", value: pendingReports, icon: AlertCircle, color: "text-amber-500", valueColor: "text-amber-600" },
                  { label: "Total Reports", value: analytics.total_reports, icon: FileText, color: "text-blue-500", valueColor: "text-blue-600" },
                  { label: "Tickets Resolved", value: analytics.total_tickets_resolved, icon: CheckCircle, color: "text-emerald-500", valueColor: "text-emerald-600" },
                  { label: "Calls Made", value: analytics.total_calls_made, icon: TrendingUp, color: "text-orange-500", valueColor: "text-orange-600" },
                ].map((metric, i) => (
                  <SupervisorMetricCard key={metric.label} {...metric} mounted={mounted} index={i + 1} />
                ))}
              </div>
            )}

            {/* SUPERVISOR: PERFORMANCE PULSE */}
            {userType === "supervisor" && analytics && (
              <Reveal mounted={mounted} index={5}>
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
                    Performance Pulse
                  </h2>
                  <div className="space-y-5">
                    {(() => {
                      const max = Math.max(
                        analytics.total_reports || 0,
                        analytics.total_tickets_resolved || 0,
                        analytics.total_calls_made || 0,
                        1
                      );
                      return (
                        <>
                          <PulseBar label="Total Reports" value={analytics.total_reports || 0} max={max} colorClass="bg-blue-500" />
                          <PulseBar label="Tickets Resolved" value={analytics.total_tickets_resolved || 0} max={max} colorClass="bg-emerald-500" />
                          <PulseBar label="Calls Made" value={analytics.total_calls_made || 0} max={max} colorClass="bg-orange-500" />
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Reveal>
            )}

            {/* RECENT REPORTS */}
            <Reveal mounted={mounted} index={6}>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">
                    Recent Reports
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        placeholder="Filter by type…"
                        className="pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] w-40"
                      />
                    </div>
                    <button
                      onClick={() => setSortAsc((prev) => !prev)}
                      className="flex items-center gap-1 text-xs font-black uppercase text-gray-500 hover:text-black transition-all"
                      title="Toggle sort order"
                    >
                      <ArrowUpDown size={14} />
                      {sortAsc ? "Oldest" : "Newest"}
                    </button>
                    <button
                      onClick={() => navigate("/reports")}
                      className="text-xs font-black uppercase text-gray-500 hover:text-black transition-all"
                    >
                      View All →
                    </button>
                  </div>
                </div>

                {visibleReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest">
                      {reportSearch ? "No matching reports" : "No reports yet"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-gray-600">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-gray-600">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-gray-600">
                            Metrics
                          </th>
                          <th className="px-6 py-4 text-left font-black text-xs uppercase tracking-widest text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {visibleReports.map((report) => (
                          <tr
                            key={report.id}
                            className="hover:bg-[#FFFBEA] cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/reports/${report.id}/approve`)}
                          >
                            <td className="px-6 py-4 font-bold text-xs">
                              {new Date(report.activity_submitted_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-bold capitalize text-xs">
                              {report.report_type}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold">
                              🎫{report.tickets_resolved} 📞{report.calls_made}
                            </td>
                            <td className="px-6 py-4">
                              {report.is_approved ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                  <CheckCircle size={12} /> Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                  <AlertCircle size={12} /> Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Reveal>

            {/* SUPERVISOR: PENDING APPROVALS SECTION */}
            {userType === "supervisor" && pendingReports > 0 && (
              <Reveal mounted={mounted} index={7}>
                <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8">
                  <div className="flex items-start gap-4">
                    <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-black uppercase tracking-tighter text-lg text-amber-900 mb-2">
                        Action Required
                      </h3>
                      <p className="text-amber-800 font-bold mb-4">
                        You have <strong>{pendingReports} report{pendingReports !== 1 ? "s" : ""}</strong> waiting for approval
                      </p>
                      <button
                        onClick={() => navigate("/reports?status=pending")}
                        className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        Review Pending Reports
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Reveal mounted={mounted} index={8}>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2.5rem] p-8 border border-blue-200 hover:shadow-lg transition-all duration-300 h-full">
                  <h3 className="font-black uppercase tracking-tighter mb-6 text-blue-900">
                    Today's Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-800">Clock Status</span>
                      <span className="font-black text-blue-600">
                        {todayStatus?.is_clocked_in ? "✓ ACTIVE" : "— INACTIVE"}
                      </span>
                    </div>
                    {liveElapsedSeconds != null && (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-800">Hours Today</span>
                        <span className="font-black text-blue-600 font-mono">
                          {formatDuration(liveElapsedSeconds)}
                        </span>
                      </div>
                    )}
                    {!todayStatus?.is_clocked_in && todayStatus?.duration_hours && (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-800">Hours Today</span>
                        <span className="font-black text-blue-600">{todayStatus.duration_hours}h</span>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>

              <Reveal mounted={mounted} index={9}>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[2.5rem] p-8 border border-purple-200 hover:shadow-lg transition-all duration-300 h-full">
                  <h3 className="font-black uppercase tracking-tighter mb-6 text-purple-900">
                    Quick Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate("/attendance")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => navigate("/reports")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      Reports
                    </button>
                    {userType === "supervisor" && (
                      <button
                        onClick={() => navigate("/analytics")}
                        className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        Analytics
                      </button>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Small extracted card so the supervisor metric grid can count up cleanly. */
function SupervisorMetricCard({ label, value, icon: Icon, color, valueColor, mounted, index }) {
  const count = useCountUp(value || 0);
  return (
    <Reveal mounted={mounted} index={index}>
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</h3>
          <Icon size={20} className={color} />
        </div>
        <p className={`text-4xl font-black tabular-nums ${valueColor}`}>{count}</p>
      </div>
    </Reveal>
  );
}