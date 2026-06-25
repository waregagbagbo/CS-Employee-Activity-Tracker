import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttendanceService from "../services/attendance";
import ReportService from "../services/reports";
import ShiftService from "../services/shifts";
import { Clock, FileText, Users, TrendingUp, AlertCircle, Loader, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Agent";
  const userType = localStorage.getItem("user_type") || "employee_agent";

  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [pendingReports, setPendingReports] = useState(0);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get today's attendance status
      const statusData = await AttendanceService.getTodaySummary();
      setTodayStatus(statusData);

      // Get recent reports
      const reportsData = await ReportService.list({ ordering: "-activity_submitted_at" });
      const reports = reportsData.results || reportsData;
      setRecentReports(reports.slice(0, 5));

      // Get pending count for supervisors
      if (userType === "supervisor") {
        const pendingData = await ReportService.getPendingApproval();
        const pending = pendingData.results || pendingData;
        setPendingReports(pending.length);

        // Get analytics
        const analyticsData = await ReportService.getAnalytics();
        setAnalytics(analyticsData);
      }

      // Get upcoming shifts
      const shiftsData = await ShiftService.getMyShifts();
      const shifts = shiftsData.results || shiftsData;
      setUpcomingShifts(shifts.slice(0, 3));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400 flex-col gap-3">
          <Loader size={24} className="animate-spin" />
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Dashboard" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* WELCOME HEADER */}
            <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white border-b-4 border-[#FFCC00]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[#FFCC00] mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* QUICK ACTIONS */}
                <div className="flex gap-3 flex-wrap">
                  {userType !== "supervisor" && (
                    <button
                      onClick={() => navigate("/attendance")}
                      className="bg-[#FFCC00] text-black px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-white transition-all"
                    >
                      Clock In/Out
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/reports")}
                    className="bg-gray-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-gray-600 transition-all"
                  >
                    Reports
                  </button>
                </div>
              </div>
            </section>

            {/* KEY METRICS - EMPLOYEE VIEW */}
            {userType !== "supervisor" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Clock Status */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Clock Status
                    </h3>
                    <Clock size={20} className="text-[#FFCC00]" />
                  </div>
                  {todayStatus?.is_clocked_in ? (
                    <>
                      <p className="text-4xl font-black text-emerald-600 mb-2">CLOCKED IN</p>
                      <p className="text-xs text-gray-600 font-bold">
                        Started: {new Date(todayStatus.clock_in_time).toLocaleTimeString()}
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

                {/* Pending Reports */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      My Reports
                    </h3>
                    <FileText size={20} className="text-blue-500" />
                  </div>
                  <p className="text-4xl font-black text-blue-600 mb-2">
                    {recentReports.length}
                  </p>
                  <p className="text-xs text-gray-600 font-bold">
                    {recentReports.filter((r) => !r.is_approved).length} pending approval
                  </p>
                </div>

                {/* Upcoming Shifts */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
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
              </div>
            )}

            {/* KEY METRICS - SUPERVISOR VIEW */}
            {userType === "supervisor" && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Pending Approval
                    </h3>
                    <AlertCircle size={20} className="text-amber-500" />
                  </div>
                  <p className="text-4xl font-black text-amber-600">{pendingReports}</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Total Reports
                    </h3>
                    <FileText size={20} className="text-blue-500" />
                  </div>
                  <p className="text-4xl font-black text-blue-600">{analytics.total_reports}</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Tickets Resolved
                    </h3>
                    <CheckCircle size={20} className="text-emerald-500" />
                  </div>
                  <p className="text-4xl font-black text-emerald-600">
                    {analytics.total_tickets_resolved}
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Calls Made
                    </h3>
                    <TrendingUp size={20} className="text-orange-500" />
                  </div>
                  <p className="text-4xl font-black text-orange-600">{analytics.total_calls_made}</p>
                </div>
              </div>
            )}

            {/* RECENT REPORTS */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Recent Reports
                </h2>
                <button
                  onClick={() => navigate("/reports")}
                  className="text-xs font-black uppercase text-gray-500 hover:text-black transition-all"
                >
                  View All →
                </button>
              </div>

              {recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest">
                    No reports yet
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
                      {recentReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/reports/${report.id}/approve`)}>
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

            {/* SUPERVISOR: PENDING APPROVALS SECTION */}
            {userType === "supervisor" && pendingReports > 0 && (
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
                      className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-amber-700 transition-all"
                    >
                      Review Pending Reports
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Status Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2.5rem] p-8 border border-blue-200">
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
                  {todayStatus?.duration_hours && (
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-800">Hours Today</span>
                      <span className="font-black text-blue-600">{todayStatus.duration_hours}h</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[2.5rem] p-8 border border-purple-200">
                <h3 className="font-black uppercase tracking-tighter mb-6 text-purple-900">
                  Quick Links
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate("/attendance")}
                    className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 transition-all"
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => navigate("/reports")}
                    className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 transition-all"
                  >
                    Reports
                  </button>
                  {userType === "supervisor" && (
                    <button
                      onClick={() => navigate("/analytics")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 transition-all"
                    >
                      Analytics
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}