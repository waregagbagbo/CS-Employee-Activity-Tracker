import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listReports } from "../services/reports";
import {
  FaFileAlt,
  FaEye,
  FaCheckCircle,
  FaLock,
  FaSearch,
  FaHistory,
  FaShieldAlt
} from "react-icons/fa";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listReports();
      setReports(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      setError("AUTHENTICATION OR SYNC ERROR: UNABLE TO RETRIEVE LEDGER.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage message="SYNCHRONIZING ACTIVITY LEDGER..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 rounded-lg">
                <FaFileAlt className="text-[#FFCC00] text-sm" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Compliance</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black">
              Activity <span className="text-[#FFCC00]">Reports</span>
            </h1>
          </div>

          <div className="flex gap-4">
             <div className="bg-white border border-gray-200 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                <FaHistory className="text-[#FFCC00]" />
                <div className="text-left">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Last Updated</p>
                   <p className="text-[10px] font-bold text-black uppercase tracking-tight">Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
             </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="FILTER BY AGENT OR ACTIVITY TYPE..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-[11px] font-black tracking-widest uppercase"
            />
          </div>
        </div>

        {error ? (
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center">
            <p className="text-rose-600 font-black uppercase tracking-widest text-xs">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 p-20 rounded-[3rem] text-center">
             <FaFileAlt className="mx-auto text-gray-100 text-6xl mb-4" />
             <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm">No recorded activities found in the ledger</p>
          </div>
        ) : (
          /* The Ledger Table */
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black">
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em]">Personnel Agent</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em]">Activity Type</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em]">Operational Notes</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em]">Compliance Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em] text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((report) => (
                    <tr key={report.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-black">
                            {report.shift_active_agent?.first_name?.charAt(0)}
                          </div>
                          <span className="text-sm font-black italic uppercase tracking-tighter text-black">
                            {report.shift_active_agent?.first_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">
                          {report.shift_activity_type}
                        </span>
                      </td>
                      <td className="px-8 py-6 max-w-[250px]">
                        <p className="text-xs text-gray-500 font-medium truncate italic">
                          {report.notes || "— No secondary notes recorded —"}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        {report.is_approved ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                            <FaCheckCircle size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFCC00] text-black rounded-md border border-[#FFCC00]">
                            <FaShieldAlt size={10} className="animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Pending Review</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="p-2.5 bg-gray-50 text-black rounded-xl hover:bg-black hover:text-[#FFCC00] transition-all shadow-sm"
                            title="Inspect Details"
                          >
                            <FaEye size={14} />
                          </button>

                          {!report.is_approved ? (
                            <button
                              onClick={() => navigate(`/reports/${report.id}/approve`)}
                              className="p-2.5 bg-black text-[#FFCC00] rounded-xl hover:scale-110 transition-all shadow-lg shadow-black/10"
                              title="Authorize Report"
                            >
                              <FaCheckCircle size={14} />
                            </button>
                          ) : (
                            <div className="p-2.5 bg-gray-100 text-gray-300 rounded-xl" title="Report Locked">
                              <FaLock size={14} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Branding */}
            <div className="bg-gray-50/50 px-8 py-4 flex justify-between items-center border-t border-gray-50">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">End of Ledger Registry</p>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#FFCC00]"></div>
                   <div className="w-2 h-2 rounded-full bg-black"></div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}