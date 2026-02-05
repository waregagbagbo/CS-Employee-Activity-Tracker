import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const STATUS_TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" }
];

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const userRole = localStorage.getItem("user_role");

  const status = searchParams.get("status") || "pending";

  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [status]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listReports({ status });
      const data = res.data.results || res.data;
      setReports(data);
      setFiltered(data);
    } catch {
      setError("UNABLE TO RETRIEVE LEDGER DATA.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SEARCH ---------------- */
  useEffect(() => {
    if (!search) return setFiltered(reports);

    const q = search.toLowerCase();
    setFiltered(
      reports.filter(
        r =>
          r.shift_active_agent?.first_name?.toLowerCase().includes(q) ||
          r.shift_activity_type?.toLowerCase().includes(q)
      )
    );
  }, [search, reports]);

  /* ---------------- UI ---------------- */
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
        <div className="flex gap-3 mb-8">
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
            placeholder="FILTER BY AGENT OR ACTIVITY TYPE..."
            className="w-full pl-14 pr-6 py-4 bg-white border rounded-2xl shadow-sm focus:ring-2 focus:ring-[#FFCC00] text-[11px] font-black tracking-widest uppercase"
          />
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-rose-50 p-6 rounded-2xl text-center text-rose-600 font-black uppercase tracking-widest text-xs">
            {error}
          </div>
        )}

        {/* Empty */}
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
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  {["Agent", "Activity", "Notes", "Status", "Actions"].map(h => (
                    <th key={h} className="px-8 py-6 text-[10px] font-black text-[#FFCC00] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-8 py-6 font-black uppercase">
                      {report.shift_active_agent?.first_name}
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black uppercase">
                      {report.shift_activity_type}
                    </td>
                    <td className="px-8 py-6 italic text-xs text-gray-500 truncate max-w-[250px]">
                      {report.notes || "—"}
                    </td>
                    <td className="px-8 py-6">
                      {report.is_approved ? (
                        <span className="inline-flex items-center gap-2 text-emerald-600">
                          <FaCheckCircle /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-black">
                          <FaShieldAlt className="animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 flex gap-3 justify-end">
                      <button
                        onClick={() =>
                          navigate(`/reports/${report.id}?status=${status}`)
                        }
                        className="p-2.5 bg-gray-50 rounded-xl hover:bg-black hover:text-[#FFCC00]"
                      >
                        <FaEye />
                      </button>

                      {report.is_approved ? (
                        <div className="p-2.5 bg-gray-100 text-gray-300 rounded-xl">
                          <FaLock />
                        </div>
                      ) : (
                        ["admin", "supervisor"].includes(userRole) && (
                          <div className="p-2.5 bg-black text-[#FFCC00] rounded-xl">
                            <FaCheckCircle />
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
