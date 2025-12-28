import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listReports, approveReport } from "../services/reports";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaUserShield,
  FaHistory,
  FaStamp
} from "react-icons/fa";

export default function ApproveReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await listReports();
      // Show only unapproved reports
      const pending = res.data.results.filter((r) => !r.is_approved);
      setReports(pending);
    } catch (err) {
      setError("CRITICAL: FAILED TO FETCH AUTHORIZATION QUEUE.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId) => {
    try {
      await approveReport(reportId, {
        is_approved: true,
        activity_status: "Approved",
        activity_approved_at: new Date().toISOString(),
      });
      loadReports();
    } catch (err) {
      alert("AUTHORIZATION ERROR: SYNC FAILED.");
    }
  };

  const handleReject = async (reportId) => {
    try {
      await approveReport(reportId, {
        is_approved: false,
        activity_status: "Rejected",
      });
      loadReports();
    } catch (err) {
      alert("REJECTION ERROR: SYNC FAILED.");
    }
  };

  if (loading) return <Loader fullPage message="SYNCHRONIZING VALIDATION QUEUE..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* Header Block */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-1 bg-[#FFCC00]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Security Authorization</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black">
              Pending <span className="text-[#FF8800]">Approvals</span>
            </h1>
            <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">
              Action Required: <span className="text-black">{reports.length} Reports</span>
            </p>
          </div>

          {error && (
            <div className="mb-8 bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-pulse">
              <FaTimesCircle className="flex-shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <FaCheckCircle className="text-4xl" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-black">Queue Synchronized</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">All system logs are currently verified.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-black text-[#FFCC00] rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                        Node #{report.id}
                      </span>
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <FaHistory className="text-[#FF8800]" /> Validation Required
                      </span>
                    </div>

                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-black mb-2 group-hover:text-[#FF8800] transition-colors">
                      {report.activity_type || "General Security Log"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <FaUserShield className="text-[10px] text-gray-400" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                          Agent: <span className="text-black">{report.shift_active_agent?.user?.username || "Unknown"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 p-5 bg-gray-50/50 rounded-2xl border border-gray-50 text-sm text-gray-600 leading-relaxed italic">
                      "{report.description}"
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48">
                    <button
                      onClick={() => handleApprove(report.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-black text-[#FFCC00] px-6 py-4 rounded-2xl hover:bg-[#FF8800] hover:text-black transition-all shadow-xl shadow-black/5"
                    >
                      <FaStamp className="text-sm" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Authorize</span>
                    </button>

                    <button
                      onClick={() => handleReject(report.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white text-rose-600 border-2 border-rose-100 px-6 py-4 rounded-2xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                    >
                      <FaTimesCircle className="text-sm" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branding Footer */}
        <div className="mt-20 border-t border-gray-100 pt-8 flex justify-between items-center opacity-50">
           <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.5em]">Onafriq Authorization Ledger</span>
           <div className="flex gap-1">
             <div className="w-4 h-1 bg-[#FFCC00]"></div>
             <div className="w-1 h-1 bg-black"></div>
           </div>
        </div>
      </div>
    </div>
  );
}