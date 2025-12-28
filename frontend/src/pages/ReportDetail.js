import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { getReport, updateReport } from "../services/reports";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaClock,
  FaFileAlt,
  FaShieldAlt,
  FaInfoCircle
} from "react-icons/fa";

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);
      if ("is_approved" in res.data) setCanApprove(true);
    } catch (err) {
      setError("FAILED TO RETRIEVE LEDGER DATA.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    try {
      await updateReport(id, {
        is_approved: true,
        activity_status: "Approved",
        activity_approved_at: new Date().toISOString(),
      });
      fetchReport();
    } catch {
      alert("AUTHORIZATION FAILED");
    }
  };

  const reject = async () => {
    try {
      await updateReport(id, {
        is_approved: false,
        activity_status: "Rejected",
      });
      fetchReport();
    } catch {
      alert("REJECTION FAILED");
    }
  };

  if (loading) return <Loader fullPage message="SYNCHRONIZING RECORD..." />;

  if (error) {
    return (
      <div className="flex bg-[#F9FAFB] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-md">
            <FaInfoCircle className="text-rose-500 text-5xl mx-auto mb-6" />
            <p className="text-black font-black uppercase tracking-widest mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="text-xs font-black uppercase tracking-widest underline hover:text-[#FFCC00]">Return to Registry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">

          {/* Back Navigation */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black mb-10 transition-all group"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-black group-hover:text-[#FFCC00] transition-all">
              <FaArrowLeft />
            </div>
            Return to Reports Ledger
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">

            {/* Header / Status Banner */}
            <div className={`px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-50 ${report.is_approved ? 'bg-emerald-50/30' : 'bg-gray-50/30'}`}>
              <div className="flex items-center gap-5">
                <div className="bg-black p-4 rounded-2xl text-[#FFCC00] shadow-lg">
                  <FaFileAlt size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Operational Report</p>
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">
                    {report.activity_type}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                  report.is_approved 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'bg-white border-black text-black'
                }`}>
                  STATUS: {report.activity_status}
                </span>
                {report.is_approved && <FaCheckCircle className="text-emerald-500 text-2xl" />}
              </div>
            </div>

            <div className="p-10">
              {/* Personnel Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-black">
                    <FaUser />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporting Agent</p>
                    <p className="text-sm font-bold text-black uppercase">{report.shift_active_agent?.user?.username || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-black">
                    <FaShieldAlt className="text-[#FFCC00]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Supervisor</p>
                    <p className="text-sm font-bold text-black uppercase">{report.supervisor?.user?.username || "PENDING ASSIGNMENT"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-black">
                    <FaClock />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Submission Timestamp</p>
                    <p className="text-sm font-bold text-black uppercase tracking-tighter">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {report.activity_approved_at && (
                  <div className="flex items-center gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                      <FaCheckCircle />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verification Date</p>
                      <p className="text-sm font-bold text-emerald-700 uppercase tracking-tighter">
                        {new Date(report.activity_approved_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Body */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-1 bg-[#FFCC00]"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Operational Summary</h3>
                </div>
                <div className="bg-black rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                  <p className="text-lg text-gray-300 leading-relaxed italic opacity-90 relative z-10">
                    "{report.description || "No specific description recorded for this activity record."}"
                  </p>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFCC00] opacity-5 rounded-bl-full pointer-events-none"></div>
                </div>
              </div>

              {/* Action Suite (Supervisor Only) */}
              {canApprove && !report.is_approved && (
                <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row gap-4">
                  <button
                    onClick={approve}
                    className="flex-1 flex items-center justify-center gap-3 bg-black text-[#FFCC00] px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
                  >
                    <FaCheckCircle size={16} />
                    Authorize Report
                  </button>

                  <button
                    onClick={reject}
                    className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-black text-black px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-all shadow-lg"
                  >
                    <FaTimesCircle size={16} />
                    Deny Record
                  </button>
                </div>
              )}

              {/* Footer Branding */}
              <div className="mt-12 text-center opacity-20">
                <p className="text-[9px] font-black text-black uppercase tracking-[0.5em]">Onafriq Cs Compliance Report</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}