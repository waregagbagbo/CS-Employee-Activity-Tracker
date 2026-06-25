import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReportService from "../services/reports";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { CheckCircle, XCircle, Loader, AlertCircle, ArrowLeft } from "lucide-react";

export default function ApproveReports() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "Supervisor";

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await ReportService.get(id);
      setReport(data);
    } catch (err) {
      setError("Failed to load report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      await ReportService.approve(id);
      setMessage("Report approved successfully!");
      setTimeout(() => navigate("/reports?status=approved"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve report");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this report?")) return;

    setRejecting(true);
    setError(null);
    try {
      await ReportService.reject(id);
      setMessage("Report rejected");
      setTimeout(() => navigate("/reports?status=pending"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject report");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400">
          Loading report...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex bg-[#F9FAFB] h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <p className="font-black uppercase tracking-widest text-gray-400">
              Report not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Review Activity Report" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-4xl mx-auto">
            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 font-bold"
            >
              <ArrowLeft size={18} /> Back to Reports
            </button>

            {/* HEADER */}
            <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white mb-8 border-b-4 border-[#FFCC00]">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">
                Report Review
              </h1>
              <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-[0.2em]">
                Review employee submission
              </p>
            </section>

            {/* MESSAGES */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-black uppercase text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl flex items-start gap-3 mb-6">
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="font-black uppercase text-sm">{message}</p>
              </div>
            )}

            {/* REPORT CONTENT */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">

              {/* EMPLOYEE INFO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Employee
                  </label>
                  <p className="font-bold text-lg">{report.employee_name}</p>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Report Type
                  </label>
                  <p className="font-bold text-lg capitalize">{report.report_type}</p>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Submitted
                  </label>
                  <p className="font-bold text-lg">
                    {new Date(report.activity_submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* SHIFT INFO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Shift Type
                  </label>
                  <p className="font-bold text-lg">{report.shift_activity_type}</p>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Supervisor
                  </label>
                  <p className="font-bold text-lg">
                    {report.supervisor?.name || "N/A"}
                  </p>
                </div>
              </div>

              {/* ACTIVITY DESCRIPTION */}
              <div className="pb-6 border-b border-gray-200">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-3">
                  Activity Description
                </label>
                <p className="font-medium text-gray-700 leading-relaxed">
                  {report.activity_description}
                </p>
              </div>

              {/* METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-600 block mb-2">
                    Tickets Resolved
                  </label>
                  <p className="font-black text-3xl text-blue-700">
                    {report.tickets_resolved || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-widest text-green-600 block mb-2">
                    Calls Made
                  </label>
                  <p className="font-black text-3xl text-green-700">
                    {report.calls_made || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-widest text-orange-600 block mb-2">
                    Issues Escalated
                  </label>
                  <p className="font-black text-3xl text-orange-700">
                    {report.issues_escalated || 0}
                  </p>
                </div>
              </div>

              {/* NOTES */}
              {report.notes && (
                <div className="pb-6 border-b border-gray-200">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-3">
                    Additional Notes
                  </label>
                  <p className="font-medium text-gray-700 leading-relaxed italic">
                    {report.notes}
                  </p>
                </div>
              )}

              {/* STATUS */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">
                  Current Status
                </label>
                <div className="flex items-center gap-3">
                  {report.is_approved ? (
                    <>
                      <CheckCircle size={24} className="text-emerald-600" />
                      <div>
                        <p className="font-black text-emerald-600">APPROVED</p>
                        <p className="text-xs text-gray-600">
                          By {report.approved_by_name} on{" "}
                          {new Date(report.activity_approved_at).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={24} className="text-amber-600" />
                      <p className="font-black text-amber-600">PENDING APPROVAL</p>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {!report.is_approved && (
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className={`flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                      approving
                        ? "bg-gray-300 text-gray-600"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                  >
                    {approving ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Approve Report
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={rejecting}
                    className={`flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                      rejecting
                        ? "bg-gray-300 text-gray-600"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                    }`}
                  >
                    {rejecting ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Reject Report
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}