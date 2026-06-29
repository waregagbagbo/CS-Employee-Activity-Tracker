import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import ReportService from "../services/reports";
import {
  FaFileAlt,
  FaEye,
  FaCheckCircle,
  FaLock,
  FaSearch,
  FaHistory,
  FaShieldAlt,
  FaDownload
} from "react-icons/fa";

const STATUS_TABS = [
  { key: "all", label: "All Reports" },
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" }
];

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const userRole = localStorage.getItem("user_type") || "employee_agent";
  const status = searchParams.get("status") || "all";

  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  /* FETCH REPORTS */
  useEffect(() => {
    fetchReports();
  }, [status]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status === "pending") {
        params.is_approved = false;
      } else if (status === "approved") {
        params.is_approved = true;
      }
      else if (status === "all"){
        params.all= true;
      }


      const data = await ReportService.list(params);
      const reportsList = data.results || data;
      setReports(reportsList);
      setFiltered(reportsList);
    } catch (err) {
      setError("UNABLE TO RETRIEVE ACTIVITY REPORTS.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* SEARCH FILTER */
  useEffect(() => {
    if (!search) return setFiltered(reports);

    const q = search.toLowerCase();
    setFiltered(
      reports.filter(
        r =>
          r.employee_name?.toLowerCase().includes(q) ||
          r.report_type?.toLowerCase().includes(q) ||
          r.shift_activity_type?.toLowerCase().includes(q)
      )
    );
  }, [search, reports]);

  /* DOWNLOAD PDF */
  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const blob = await ReportService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <Loader fullPage message="SYNCHRONIZING ACTIVITY LEDGER..." />;
  }

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 rounded-lg">
                <FaFileAlt className="text-[#FFCC00]" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                Operational Compliance
              </span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              Activity <span className="text-[#FFCC00]">Reports</span>
            </h1>
          </div>

          <div className="bg-white border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
            <FaHistory className="text-[#FFCC00]" />
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                Last Updated
              </p>
              <p className="text-[10px] font-bold uppercase">
                Today {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ status: tab.key })}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                ${status === tab.key
                  ? "bg-black text-[#FFCC00] border-black"
                  : "bg-white text-gray-400 border-gray-200 hover:border-black"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="FILTER BY EMPLOYEE, REPORT TYPE, OR SHIFT..."
            className="w-full pl-14 pr-6 py-4 bg-white border rounded-2xl shadow-sm focus:ring-2 focus:ring-[#FFCC00] text-[11px] font-black tracking-widest uppercase"
          />
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-rose-50 p-6 rounded-2xl text-center text-rose-600 font-black uppercase tracking-widest text-xs">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!error && filtered.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] text-center">
            <FaFileAlt className="mx-auto text-gray-100 text-6xl mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest">
              No reports found
            </p>
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Employee</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Report Type</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Shift</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Metrics</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Submitted</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-left">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6 font-black uppercase text-sm">
                        {report.employee_name || "—"}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black uppercase">
                        <span className="bg-gray-100 px-3 py-1 rounded-full">
                          {report.report_type || "—"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-600">
                        {report.shift_activity_type || "—"}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold">
                        <div className="space-y-1">
                          <div>🎫 {report.tickets_resolved || 0}</div>
                          <div>📞 {report.calls_made || 0}</div>
                          <div>⚠️ {report.issues_escalated || 0}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-600 font-bold">
                        {new Date(report.activity_submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        {report.is_approved ? (
                          <span className="inline-flex items-center gap-2 text-emerald-600 font-bold text-xs">
                            <FaCheckCircle /> APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-black font-bold text-xs">
                            <FaShieldAlt className="animate-pulse" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 flex gap-3 justify-center">
                        <button
                          onClick={() =>
                            navigate(`/reports/${report.id}?status=${status}`)
                          }
                          className="p-2.5 bg-gray-50 rounded-xl hover:bg-black hover:text-[#FFCC00] transition-all"
                          title="View Report"
                        >
                          <FaEye />
                        </button>

                        {report.is_approved ? (
                          <button
                            onClick={() => handleDownload(report.id)}
                            disabled={downloading === report.id}
                            className="p-2.5 bg-[#FFCC00] text-black rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloading === report.id ? (
                              <span className="animate-spin">⟳</span>
                            ) : (
                              <FaDownload />
                            )}
                          </button>
                        ) : userRole === "supervisor" ? (
                          <button
                            onClick={() =>
                              navigate(`/reports/${report.id}/approve?status=${status}`)
                            }
                            className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                            title="Approve Report"
                          >
                            <FaCheckCircle />
                          </button>
                        ) : (
                          <div className="p-2.5 bg-gray-100 text-gray-300 rounded-xl">
                            <FaLock />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}