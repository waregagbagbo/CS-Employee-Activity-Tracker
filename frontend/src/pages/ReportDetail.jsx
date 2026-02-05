import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { getReport, approveReport } from "../services/reports";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaUser,
  FaClock,
  FaFileAlt,
  FaShieldAlt,
  FaInfoCircle
} from "react-icons/fa";

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem("user_role");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canApprove = ["admin", "supervisor"].includes(userRole);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, []);

  const fetchReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);
    } catch {
      setError("FAILED TO RETRIEVE LEDGER DATA.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    try {
      await approveReport(id);
      fetchReport();
    } catch {
      alert("APPROVAL FAILED OR UNAUTHORIZED");
    }
  };

  // Preserve filters when going back (status-aware navigation)
  const goBack = () => {
    navigate(`/reports${location.search || ""}`);
  };

  if (loading) return <Loader fullPage message="SYNCHRONIZING RECORD..." />;

  if (error) {
    return (
      <div className="flex bg-[#F9FAFB] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-md">
            <FaInfoCircle className="text-rose-500 text-5xl mx-auto mb-6" />
            <p className="text-black font-black uppercase tracking-widest mb-4">
              {error}
            </p>
            <button
              onClick={goBack}
              className="text-xs font-black uppercase tracking-widest underline hover:text-[#FFCC00]"
            >
              Return to Registry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = report.is_approved;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <button
            onClick={goBack}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black mb-10"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <FaArrowLeft />
            </div>
            Return to Reports Ledger
          </button>

          {/* Card */}
          <div className="bg-white rounded-[3rem] shadow border border-gray-100 overflow-hidden">

            {/* Header */}
            <div
              className={`px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b
              ${isLocked ? "bg-emerald-50/30" : "bg-gray-50/30"}`}
            >
              <div className="flex items-center gap-5">
                <div className="bg-black p-4 rounded-2xl text-[#FFCC00]">
                  <FaFileAlt size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                    Operational Report
                  </p>
                  <h1 className="text-3xl font-black italic uppercase">
                    {report.activity_type}
                  </h1>
                </div>
              </div>

              <span
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2
                ${isLocked
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-black text-black"}`}
              >
                STATUS: {report.activity_status}
              </span>
            </div>

            {/* Body */}
            <div className="p-10">

              {/* Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Meta icon={<FaUser />} label="Reporting Agent" value={report.shift_active_agent?.user?.username} />
                <Meta icon={<FaShieldAlt />} label="Supervisor" value={report.supervisor?.user?.username || "PENDING"} />
                <Meta icon={<FaClock />} label="Submitted At" value={new Date(report.created_at).toLocaleString()} />

                {report.activity_approved_at && (
                  <Meta
                    icon={<FaCheckCircle />}
                    label="Approved At"
                    value={new Date(report.activity_approved_at).toLocaleString()}
                    highlight
                  />
                )}
              </div>

              {/* Description */}
              <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                  Operational Summary
                </h3>
                <div className="bg-black rounded-[2rem] p-8 text-gray-300 italic">
                  “{report.description || "No description provided."}”
                </div>
              </div>

              {/* Approval (locked after approval) */}
              {canApprove && !isLocked && (
                <div className="pt-10 border-t">
                  <button
                    onClick={approve}
                    className="w-full bg-black text-[#FFCC00] py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02]"
                  >
                    <FaCheckCircle className="inline mr-2" />
                    Approve Report
                  </button>
                </div>
              )}

              {isLocked && (
                <div className="mt-10 text-center text-emerald-600 font-black uppercase tracking-widest text-xs">
                  This report is locked and cannot be modified
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small reusable meta block */
function Meta({ icon, label, value, highlight }) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl ${highlight ? "bg-emerald-50" : "bg-gray-50"}`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="text-sm font-bold uppercase">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}
